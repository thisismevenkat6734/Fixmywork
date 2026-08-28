/* =========================================================
   FIX MY WORK
   Customer Application
   Firebase + Firestore + Cloudinary + Location + Map
   ========================================================= */


/* =========================================================
   1. FIREBASE IMPORTS
   ========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    doc,
    setDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================================================
   2. FIREBASE CONFIGURATION
   ========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyCP8DGLQMXPUsv_p2zQ-NLkziwPQe1XkgU",
    authDomain: "fixmywork-d83ba.firebaseapp.com",
    databaseURL: "https://fixmywork-d83ba-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "fixmywork-d83ba",
    storageBucket: "fixmywork-d83ba.firebasestorage.app",
    messagingSenderId: "207313302232",
    appId: "1:207313302232:web:73055348982ad84abeddad",
    measurementId: "G-11FQMLCBQY"
};


/* =========================================================
   3. FIREBASE INITIALIZATION
   ========================================================= */

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const db = getFirestore(firebaseApp);


/* =========================================================
   4. CLOUDINARY CONFIGURATION
   ========================================================= */

const CLOUDINARY_CLOUD_NAME = "lqfozcs3";

const CLOUDINARY_UPLOAD_PRESET = "fixmywork_upload";


/* =========================================================
   5. APPLICATION STATE
   ========================================================= */

let currentUser = null;

let customerEmail = "";

let currentLocation = {
    latitude: null,
    longitude: null,
    address: ""
};

let selectedService = "";

let customerWorksUnsubscribe = null;

let map = null;

let customerMarker = null;

let workerMarkers = [];


/* =========================================================
   6. DOM HELPERS
   ========================================================= */

const getElement = (id) => {
    return document.getElementById(id);
};

const authModal = getElement("authModal");

const serviceModal = getElement("serviceModal");

const authForm = getElement("authForm");

const serviceForm = getElement("serviceForm");

const serviceSelect = getElement("serviceSelect");

const serviceDescription = getElement("problemDescription");

const serviceAddress = getElement("serviceAddress");

const servicePhoto = getElement("servicePhoto");

const photoPreview = getElement("photoPreview");

const worksContainer = getElement("worksContainer");

const toastContainer = getElement("toastContainer");

const authButton = getElement("authButton");

const locationButton = getElement("locationButton");

const useLocationButton = getElement("useLocationButton");

const requestServiceButton = getElement("requestServiceButton");

const emptyRequestButton = getElement("emptyRequestButton");

const supportButton = getElement("supportButton");

const menuButton = getElement("menuButton");

const closeSafety = getElement("closeSafety");

const safetyNotice = getElement("safetyNotice");

const mapStatus = getElement("mapStatus");

const nearbyCount = getElement("nearbyCount");

const currentYear = getElement("currentYear");


/* =========================================================
   7. BASIC UTILITIES
   ========================================================= */

function showToast(message, type = "normal") {
    if (!toastContainer) {
        alert(message);
        return;
    }

    const toast = document.createElement("div");

    toast.className = `toast ${type}`;

    toast.textContent = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}


function escapeHTML(value) {
    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}


function formatDate(timestamp) {
    if (!timestamp) {
        return "Recently";
    }

    try {
        const date = timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return "Recently";
    }
}


/* =========================================================
   8. MODAL FUNCTIONS
   ========================================================= */

function openModal(modal) {
    if (!modal) {
        return;
    }

    modal.classList.remove("hidden");

    document.body.style.overflow = "hidden";
}


function closeModal(modal) {
    if (!modal) {
        return;
    }

    modal.classList.add("hidden");

    document.body.style.overflow = "";
}


document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => {
        const modalId = button.dataset.closeModal;

        closeModal(getElement(modalId));
    });
});


document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal(modal);
        }
    });
});


document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
        return;
    }

    closeModal(authModal);

    closeModal(serviceModal);
});


/* =========================================================
   9. FIREBASE AUTHENTICATION
   ========================================================= */

async function initializeAuthentication() {
    try {
        await signInAnonymously(auth);
    } catch (error) {
        console.error("Firebase authentication error:", error);

        showToast(
            "Unable to connect securely. Please try again.",
            "error"
        );
    }
}


onAuthStateChanged(auth, (user) => {
    currentUser = user;

    if (!user) {
        return;
    }

    loadCustomerWorks(user.uid);
});


/* =========================================================
   10. LOGIN / CUSTOMER EMAIL
   ========================================================= */

authButton?.addEventListener("click", () => {
    if (currentUser && customerEmail) {
        showToast(`Signed in as ${customerEmail}`, "success");
        return;
    }

    openModal(authModal);
});


authForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const emailInput = getElement("authEmail");

    const email = emailInput?.value.trim().toLowerCase();

    if (!email) {
        showToast("Please enter your email address.", "error");
        return;
    }

    if (!currentUser) {
        showToast(
            "Connecting securely. Please try again.",
            "error"
        );

        return;
    }

    customerEmail = email;

    try {
        await setDoc(
            doc(db, "customers", currentUser.uid),
            {
                email: customerEmail,
                updatedAt: serverTimestamp()
            },
            {
                merge: true
            }
        );

        authButton.textContent = "My Account";

        closeModal(authModal);

        showToast(
            "Your customer profile is ready.",
            "success"
        );

    } catch (error) {
        console.error("Customer profile error:", error);

        showToast(
            "Could not save your profile.",
            "error"
        );
    }
});


/* =========================================================
   11. SERVICE MODAL
   ========================================================= */

function openServiceModal(service = "") {
    selectedService = service;

    if (serviceSelect && service) {
        serviceSelect.value = service;
    }

    const selectedText = getElement("selectedServiceText");

    if (selectedText) {
        selectedText.textContent = service
            ? `Requesting ${service}. Tell us what you need.`
            : "Tell us what you need.";
    }

    openModal(serviceModal);
}


requestServiceButton?.addEventListener("click", () => {
    openServiceModal();
});


emptyRequestButton?.addEventListener("click", () => {
    openServiceModal();
});


document.querySelectorAll(".service-card").forEach((card) => {
    card.addEventListener("click", () => {
        const service = card.dataset.service || "";

        openServiceModal(service);
    });
});


serviceSelect?.addEventListener("change", () => {
    selectedService = serviceSelect.value;

    const selectedText = getElement("selectedServiceText");

    if (selectedText && selectedService) {
        selectedText.textContent =
            `Requesting ${selectedService}. Tell us what you need.`;
    }
});


/* =========================================================
   12. PHOTO PREVIEW
   ========================================================= */

servicePhoto?.addEventListener("change", () => {
    if (!photoPreview) {
        return;
    }

    photoPreview.innerHTML = "";

    const files = Array.from(servicePhoto.files || []);

    files.slice(0, 6).forEach((file) => {
        if (!file.type.startsWith("image/")) {
            return;
        }

        const image = document.createElement("img");

        image.alt = "Selected service photo";

        const reader = new FileReader();

        reader.onload = () => {
            image.src = reader.result;

            photoPreview.appendChild(image);
        };

        reader.readAsDataURL(file);
    });
});


/* =========================================================
   13. CLOUDINARY IMAGE UPLOAD
   ========================================================= */

async function uploadImageToCloudinary(file) {
    const uploadURL =
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

    const formData = new FormData();

    formData.append(
        "file",
        file
    );

    formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
    );

    const response = await fetch(
        uploadURL,
        {
            method: "POST",
            body: formData
        }
    );

    if (!response.ok) {
        throw new Error(
            `Cloudinary upload failed: ${response.status}`
        );
    }

    const result = await response.json();

    return {
        url: result.secure_url,
        publicId: result.public_id
    };
}


async function uploadServicePhotos(files) {
    const validFiles = Array.from(files || [])
        .filter((file) => file.type.startsWith("image/"))
        .slice(0, 6);

    if (!validFiles.length) {
        return [];
    }

    const results = [];

    for (const file of validFiles) {
        const uploaded = await uploadImageToCloudinary(file);

        results.push(uploaded);
    }

    return results;
}


/* =========================================================
   14. CUSTOMER LOCATION
   ========================================================= */

function requestCustomerLocation() {
    if (!navigator.geolocation) {
        showToast(
            "Location is not supported on this device.",
            "error"
        );

        return;
    }

    mapStatus.textContent = "Getting your location...";

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const latitude = position.coords.latitude;

            const longitude = position.coords.longitude;

            currentLocation.latitude = latitude;

            currentLocation.longitude = longitude;

            updateCustomerMap(
                latitude,
                longitude
            );

            await reverseGeocode(
                latitude,
                longitude
            );

            mapStatus.textContent =
                "Your location is ready";

            nearbyCount.textContent =
                "Finding nearby professionals...";

            loadNearbyWorkers(
                latitude,
                longitude
            );

            if (serviceAddress && currentLocation.address) {
                serviceAddress.value =
                    currentLocation.address;
            }

            showToast(
                "Location detected successfully.",
                "success"
            );
        },

        (error) => {
            console.error("Location error:", error);

            mapStatus.textContent =
                "Location permission required";

            showToast(
                "Please allow location permission to find nearby professionals.",
                "error"
            );
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
        }
    );
}


locationButton?.addEventListener(
    "click",
    requestCustomerLocation
);


useLocationButton?.addEventListener(
    "click",
    requestCustomerLocation
);


/* =========================================================
   15. REVERSE GEOCODING
   ========================================================= */

async function reverseGeocode(latitude, longitude) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,
            {
                headers: {
                    "Accept": "application/json"
                }
            }
        );

        if (!response.ok) {
            return;
        }

        const result = await response.json();

        currentLocation.address =
            result.display_name || "";

    } catch (error) {
        console.error(
            "Reverse geocoding error:",
            error
        );
    }
}


/* =========================================================
   16. LEAFLET MAP LOADER
   ========================================================= */

function loadLeaflet() {
    return new Promise((resolve, reject) => {
        if (window.L) {
            resolve(window.L);
            return;
        }

        const existingScript =
            document.querySelector(
                'script[data-leaflet="true"]'
            );

        if (existingScript) {
            existingScript.addEventListener(
                "load",
                () => resolve(window.L)
            );

            existingScript.addEventListener(
                "error",
                reject
            );

            return;
        }

        const style = document.createElement("link");

        style.rel = "stylesheet";

        style.href =
            "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

        document.head.appendChild(style);

        const script = document.createElement("script");

        script.src =
            "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

        script.async = true;

        script.dataset.leaflet = "true";

        script.onload = () => resolve(window.L);

        script.onerror = reject;

        document.head.appendChild(script);
    });
}


/* =========================================================
   17. MAP INITIALIZATION
   ========================================================= */

async function initializeMap() {
    const mapElement = getElement("map");

    if (!mapElement) {
        return;
    }

    try {
        const L = await loadLeaflet();

        map = L.map(
            mapElement,
            {
                zoomControl: true,
                attributionControl: true
            }
        ).setView(
            [16.3067, 80.4365],
            13
        );

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,
                attribution: "&copy; OpenStreetMap contributors"
            }
        ).addTo(map);

    } catch (error) {
        console.error(
            "Map initialization error:",
            error
        );
    }
}


/* =========================================================
   18. CUSTOMER MAP MARKER
   ========================================================= */

function updateCustomerMap(
    latitude,
    longitude
) {
    if (!map || !window.L) {
        return;
    }

    if (customerMarker) {
        customerMarker.remove();
    }

    customerMarker =
        window.L.marker([
            latitude,
            longitude
        ])
        .addTo(map)
        .bindPopup(
            "<strong>Your location</strong>"
        );

    map.setView(
        [
            latitude,
            longitude
        ],
        15
    );

    customerMarker.openPopup();
}


/* =========================================================
   19. DISTANCE CALCULATION
   ========================================================= */

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {
    const earthRadius = 6371;

    const latitudeDifference =
        (lat2 - lat1) * Math.PI / 180;

    const longitudeDifference =
        (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(latitudeDifference / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(longitudeDifference / 2) ** 2;

    return (
        earthRadius *
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        )
    );
}


/* =========================================================
   20. NEARBY WORKERS
   ========================================================= */

async function loadNearbyWorkers(
    latitude,
    longitude
) {
    if (!map || !window.L) {
        return;
    }

    workerMarkers.forEach((marker) => {
        marker.remove();
    });

    workerMarkers = [];

    try {
        const workersQuery = query(
            collection(db, "workers"),
            where("approved", "==", true)
        );

        onSnapshot(
            workersQuery,
            (snapshot) => {
                let nearbyWorkers = 0;

                snapshot.forEach((workerDoc) => {
                    const worker = workerDoc.data();

                    const workerLatitude =
                        Number(worker.latitude);

                    const workerLongitude =
                        Number(worker.longitude);

                    if (
                        !Number.isFinite(workerLatitude) ||
                        !Number.isFinite(workerLongitude)
                    ) {
                        return;
                    }

                    const distance =
                        calculateDistance(
                            latitude,
                            longitude,
                            workerLatitude,
                            workerLongitude
                        );

                    if (distance > 25) {
                        return;
                    }

                    nearbyWorkers++;

                    const marker =
                        window.L.marker([
                            workerLatitude,
                            workerLongitude
                        ])
                        .addTo(map)
                        .bindPopup(`
                            <strong>
                                ${escapeHTML(
                                    worker.name ||
                                    "Service Professional"
                                )}
                            </strong>
                            <br>
                            ${distance.toFixed(1)} km away
                        `);

                    workerMarkers.push(marker);
                });

                nearbyCount.textContent =
                    nearbyWorkers > 0
                        ? `${nearbyWorkers} professional${nearbyWorkers === 1 ? "" : "s"} nearby`
                        : "No professionals found nearby";
            },
            (error) => {
                console.warn(
                    "Worker map unavailable:",
                    error
                );

                nearbyCount.textContent =
                    "Nearby professionals will appear here";
            }
        );

    } catch (error) {
        console.error(
            "Worker loading error:",
            error
        );
    }
}


/* =========================================================
   21. SERVICE REQUEST CREATION
   ========================================================= */

serviceForm?.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        if (!currentUser) {
            showToast(
                "Please wait for secure connection.",
                "error"
            );

            return;
        }

        const service =
            serviceSelect?.value.trim();

        const description =
            serviceDescription?.value.trim();

        const address =
            serviceAddress?.value.trim();

        if (!service) {
            showToast(
                "Please select a service.",
                "error"
            );

            return;
        }

        if (!description) {
            showToast(
                "Please describe the problem.",
                "error"
            );

            return;
        }

        if (!address) {
            showToast(
                "Please enter the service location.",
                "error"
            );

            return;
        }

        const submitButton =
            serviceForm.querySelector(
                'button[type="submit"]'
            );

        const originalText =
            submitButton?.textContent ||
            "Find a Professional";

        try {
            if (submitButton) {
                submitButton.disabled = true;

                submitButton.textContent =
                    "Creating request...";
            }

            let photoData = [];

            if (servicePhoto?.files?.length) {
                if (submitButton) {
                    submitButton.textContent =
                        "Uploading photos...";
                }

                photoData =
                    await uploadServicePhotos(
                        servicePhoto.files
                    );
            }

            if (submitButton) {
                submitButton.textContent =
                    "Saving request...";
            }

            const requestData = {
                customerId: currentUser.uid,

                customerEmail:
                    customerEmail || "",

                service,

                description,

                address,

                latitude:
                    currentLocation.latitude,

                longitude:
                    currentLocation.longitude,

                photos: photoData,

                status: "pending",

                assignedWorkerId: null,

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()
            };

            const requestReference =
                await addDoc(
                    collection(
                        db,
                        "serviceRequests"
                    ),
                    requestData
                );

            await setDoc(
                doc(
                    db,
                    "customers",
                    currentUser.uid
                ),
                {
                    email:
                        customerEmail || "",
                    updatedAt:
                        serverTimestamp()
                },
                {
                    merge: true
                }
            );

            closeModal(serviceModal);

            serviceForm.reset();

            if (photoPreview) {
                photoPreview.innerHTML = "";
            }

            selectedService = "";

            showToast(
                "Service request created successfully.",
                "success"
            );

            console.log(
                "Service request created:",
                requestReference.id
            );

            loadCustomerWorks(
                currentUser.uid
            );

        } catch (error) {
            console.error(
                "Service request error:",
                error
            );

            showToast(
                "Could not create your request. Please try again.",
                "error"
            );

        } finally {
            if (submitButton) {
                submitButton.disabled = false;

                submitButton.textContent =
                    originalText;
            }
        }
    }
);


/* =========================================================
   22. CUSTOMER WORKS
   ========================================================= */

function loadCustomerWorks(customerId) {
    if (!worksContainer) {
        return;
    }

    if (customerWorksUnsubscribe) {
        customerWorksUnsubscribe();

        customerWorksUnsubscribe = null;
    }

    const worksQuery = query(
        collection(
            db,
            "serviceRequests"
        ),
        where(
            "customerId",
            "==",
            customerId
        )
    );

    customerWorksUnsubscribe =
        onSnapshot(
            worksQuery,
            (snapshot) => {
                const works = [];

                snapshot.forEach((workDoc) => {
                    works.push({
                        id: workDoc.id,
                        ...workDoc.data()
                    });
                });

                works.sort(
                    (a, b) => {
                        const aTime =
                            a.createdAt?.toMillis?.() || 0;

                        const bTime =
                            b.createdAt?.toMillis?.() || 0;

                        return bTime - aTime;
                    }
                );

                renderCustomerWorks(works);
            },
            (error) => {
                console.error(
                    "Works loading error:",
                    error
                );

                showToast(
                    "Unable to load your works.",
                    "error"
                );
            }
        );
}


/* =========================================================
   23. WORK STATUS
   ========================================================= */

function getStatusLabel(status) {
    const labels = {
        pending: "Request Sent",
        searching: "Finding Professional",
        assigned: "Professional Assigned",
        accepted: "Accepted",
        on_the_way: "On the Way",
        in_progress: "Work In Progress",
        completed: "Completed",
        cancelled: "Cancelled",
        rejected: "Not Accepted"
    };

    return labels[status] ||
        "Request Received";
}


function getStatusClass(status) {
    if (
        status === "completed"
    ) {
        return "status-completed";
    }

    if (
        status === "cancelled" ||
        status === "rejected"
    ) {
        return "status-cancelled";
    }

    if (
        status === "in_progress" ||
        status === "on_the_way"
    ) {
        return "status-active";
    }

    return "status-pending";
}


/* =========================================================
   24. WORK CARD RENDERING
   ========================================================= */

function renderCustomerWorks(works) {
    if (!worksContainer) {
        return;
    }

    if (!works.length) {
        worksContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>

                <h3>
                    No active works
                </h3>

                <p>
                    Your service requests and completed works
                    will appear here.
                </p>

                <button
                    id="dynamicRequestButton"
                    class="primary-button"
                    type="button"
                >
                    Request a Service
                </button>
            </div>
        `;

        getElement(
            "dynamicRequestButton"
        )?.addEventListener(
            "click",
            () => openServiceModal()
        );

        return;
    }

    worksContainer.innerHTML =
        works.map(
            (work) => `
                <article
                    class="work-card"
                    data-work-id="${escapeHTML(work.id)}"
                >

                    <div class="work-card-header">

                        <div>

                            <span class="work-service">
                                ${escapeHTML(
                                    work.service ||
                                    "Service"
                                )}
                            </span>

                            <small>
                                ${formatDate(
                                    work.createdAt
                                )}
                            </small>

                        </div>

                        <span
                            class="work-status ${getStatusClass(
                                work.status
                            )}"
                        >
                            ${escapeHTML(
                                getStatusLabel(
                                    work.status
                                )
                            )}
                        </span>

                    </div>


                    <p class="work-description">
                        ${escapeHTML(
                            work.description ||
                            "No description"
                        )}
                    </p>


                    <div class="work-location">
                        📍
                        ${escapeHTML(
                            work.address ||
                            "Location not available"
                        )}
                    </div>


                    ${
                        work.workerName
                            ? `
                                <div class="assigned-worker">
                                    <strong>
                                        Professional
                                    </strong>

                                    <span>
                                        ${escapeHTML(
                                            work.workerName
                                        )}
                                    </span>
                                </div>
                            `
                            : ""
                    }


                    ${
                        Array.isArray(work.photos) &&
                        work.photos.length
                            ? `
                                <div class="work-photos">
                                    ${work.photos
                                        .map(
                                            (photo) => `
                                                <img
                                                    src="${escapeHTML(
                                                        photo.url
                                                    )}"
                                                    alt="Service request photo"
                                                    loading="lazy"
                                                >
                                            `
                                        )
                                        .join("")}
                                </div>
                            `
                            : ""
                    }


                    ${
                        work.status === "completed"
                            ? renderRatingSection(
                                work
                            )
                            : ""
                    }

                </article>
            `
        ).join("");

    bindRatingButtons();
}


/* =========================================================
   25. RATING SECTION
   ========================================================= */

function renderRatingSection(work) {
    const existingRating =
        Number(work.customerRating || 0);

    if (existingRating > 0) {
        return `
            <div class="work-rating-complete">
                ⭐ You rated this professional
                ${existingRating}/5
            </div>
        `;
    }

    return `
        <div class="work-rating">

            <strong>
                Rate the professional
            </strong>

            <div
                class="rating-buttons"
                data-rating-work="${escapeHTML(
                    work.id
                )}"
            >

                ${[1, 2, 3, 4, 5]
                    .map(
                        (number) => `
                            <button
                                type="button"
                                class="rating-button"
                                data-rating="${number}"
                            >
                                ${number}★
                            </button>
                        `
                    )
                    .join("")}

            </div>

        </div>
    `;
}


/* =========================================================
   26. SAVE CUSTOMER RATING
   ========================================================= */

function bindRatingButtons() {
    document
        .querySelectorAll(
            ".rating-buttons"
        )
        .forEach((container) => {

            container
                .querySelectorAll(
                    ".rating-button"
                )
                .forEach((button) => {

                    button.addEventListener(
                        "click",
                        async () => {

                            const workId =
                                container.dataset.ratingWork;

                            const rating =
                                Number(
                                    button.dataset.rating
                                );

                            if (
                                rating < 1 ||
                                rating > 5
                            ) {
                                return;
                            }

                            try {
                                await updateDoc(
                                    doc(
                                        db,
                                        "serviceRequests",
                                        workId
                                    ),
                                    {
                                        customerRating:
                                            rating,

                                        customerRatedAt:
                                            serverTimestamp(),

                                        updatedAt:
                                            serverTimestamp()
                                    }
                                );

                                showToast(
                                    "Thank you for your rating.",
                                    "success"
                                );

                            } catch (error) {
                                console.error(
                                    "Rating error:",
                                    error
                                );

                                showToast(
                                    "Could not save your rating.",
                                    "error"
                                );
                            }
                        }
                    );
                });
        });
}


/* =========================================================
   27. SAFETY NOTICE
   ========================================================= */

closeSafety?.addEventListener(
    "click",
    () => {
        if (safetyNotice) {
            safetyNotice.remove();
        }
    }
);


/* =========================================================
   28. MOBILE MENU
   ========================================================= */

menuButton?.addEventListener(
    "click",
    () => {

        const navigation =
            document.querySelector(
                ".desktop-nav"
            );

        if (!navigation) {
            return;
        }

        const isOpen =
            navigation.classList.toggle(
                "mobile-nav-open"
            );

        menuButton.setAttribute(
            "aria-expanded",
            String(isOpen)
        );
    }
);


document
    .querySelectorAll(
        ".desktop-nav a"
    )
    .forEach((link) => {

        link.addEventListener(
            "click",
            () => {

                const navigation =
                    document.querySelector(
                        ".desktop-nav"
                    );

                navigation?.classList.remove(
                    "mobile-nav-open"
                );

                menuButton?.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        );
    });


/* =========================================================
   29. SUPPORT
   ========================================================= */

supportButton?.addEventListener(
    "click",
    () => {

        const supportEmail =
            "support@fixmywork.in";

        window.location.href =
            `mailto:${supportEmail}?subject=FIX MY WORK Support`;

    }
);


/* =========================================================
   30. FOOTER YEAR
   ========================================================= */

if (currentYear) {
    currentYear.textContent =
        new Date().getFullYear();
}


/* =========================================================
   31. INITIAL APPLICATION START
   ========================================================= */

async function startApplication() {

    await initializeMap();

    await initializeAuthentication();

    console.log(
        "FIX MY WORK customer application started."
    );
}


startApplication();
