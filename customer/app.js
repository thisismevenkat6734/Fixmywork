    /* =========================================================
   FIX MY WORK — CUSTOMER APP
   Complete Customer Frontend + Firebase Backend Logic
========================================================= */

import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signInAnonymously,
    signOut
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    orderBy,
    limit
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from
"https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyCP8DGLQMXPUsv_p2zQ-NLkziwPQe1XkgU",
    authDomain: "fixmywork-d83ba.firebaseapp.com",
    projectId: "fixmywork-d83ba",
    storageBucket: "fixmywork-d83ba.firebasestorage.app",
    messagingSenderId: "207313302232",
    appId: "1:207313302232:web:73055348982ad84abeddad"
};


/* =========================================================
   FIREBASE INITIALIZATION
========================================================= */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const storage = getStorage(app);


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;

let currentOrderId = null;

let currentOrderUnsubscribe = null;

let currentHistoryUnsubscribe = null;

let selectedService = "";

let selectedLocation = null;

let selectedPhotos = [];

let isSubmittingOrder = false;


/* =========================================================
   100 SERVICE CATEGORIES
========================================================= */

const SERVICES = [
    "Electrical",
    "Plumbing",
    "AC Repair",
    "RO & Water Purifier",
    "Refrigerator Repair",
    "Washing Machine Repair",
    "TV Repair",
    "Microwave Repair",
    "Geyser Repair",
    "Chimney Repair",
    "Water Heater Repair",
    "Cooler Repair",
    "Dishwasher Repair",
    "Inverter Repair",
    "UPS Repair",
    "Generator Service",
    "Fan Repair",
    "Motor Repair",
    "Pump Repair",
    "Water Motor Repair",
    "Borewell Service",
    "Carpentry",
    "Furniture Repair",
    "Furniture Assembly",
    "Door Repair",
    "Window Repair",
    "Locksmith",
    "Glass Work",
    "Aluminium Work",
    "UPVC Work",
    "Painting",
    "Wall Painting",
    "Interior Painting",
    "Exterior Painting",
    "Waterproofing",
    "Tile Work",
    "Marble Work",
    "Granite Work",
    "Flooring",
    "False Ceiling",
    "POP Work",
    "Modular Kitchen",
    "Bathroom Renovation",
    "Kitchen Renovation",
    "Home Renovation",
    "Masonry",
    "Civil Work",
    "Roof Repair",
    "Terrace Repair",
    "Leakage Repair",
    "Pest Control",
    "Termite Control",
    "Cleaning",
    "Deep Cleaning",
    "Bathroom Cleaning",
    "Kitchen Cleaning",
    "Sofa Cleaning",
    "Carpet Cleaning",
    "Water Tank Cleaning",
    "House Cleaning",
    "Office Cleaning",
    "AC Cleaning",
    "AC Installation",
    "AC Gas Filling",
    "AC Uninstallation",
    "DTH Installation",
    "DTH Repair",
    "Internet Installation",
    "WiFi Setup",
    "CCTV Installation",
    "CCTV Repair",
    "Computer Repair",
    "Laptop Repair",
    "Printer Repair",
    "Mobile Repair",
    "Mobile Screen Repair",
    "Mobile Software Service",
    "Computer Software Service",
    "Data Recovery",
    "Home Appliance Service",
    "Electric Stove Repair",
    "Induction Stove Repair",
    "Gas Stove Repair",
    "Gas Pipeline Service",
    "Solar Panel Service",
    "Solar Water Heater",
    "Battery Service",
    "Bike Repair",
    "Car Repair",
    "Car Washing",
    "Bike Washing",
    "Tyre Service",
    "Wheel Alignment",
    "Towing Service",
    "Packers & Movers",
    "Courier Service",
    "Gardening",
    "Home Shifting Help",
    "Driver Service",
    "Security Guard Service",
    "Event Decoration",
    "Other Home Service"
];


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

function showToast(message, type = "info") {

    const container = $("toastContainer");

    if (!container) {
        alert(message);
        return;
    }

    const toast = document.createElement("div");

    toast.className = `toast toast-${type}`;

    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}


function openModal(id) {

    const modal = $(id);

    if (modal) {
        modal.classList.remove("hidden");
    }
}


function closeModal(id) {

    const modal = $(id);

    if (modal) {
        modal.classList.add("hidden");
    }
}


/* =========================================================
   AUTHENTICATION
========================================================= */

async function ensureAuthentication() {

    if (auth.currentUser) {
        currentUser = auth.currentUser;
        return currentUser;
    }

    try {

        const result = await signInAnonymously(auth);

        currentUser = result.user;

        await createCustomerProfile();

        return currentUser;

    } catch (error) {

        console.error("Authentication error:", error);

        showToast(
            "Unable to connect to FIX MY WORK. Please try again.",
            "error"
        );

        throw error;
    }
}


/* =========================================================
   CUSTOMER PROFILE
========================================================= */

async function createCustomerProfile() {

    if (!currentUser) return;

    const customerRef =
        doc(db, "customers", currentUser.uid);

    const existing =
        await getDoc(customerRef);

    if (!existing.exists()) {

        await setDoc(customerRef, {

            uid: currentUser.uid,

            role: "customer",

            name: "",

            email: "",

            phone: "",

            address: "",

            latitude: null,

            longitude: null,

            createdAt: serverTimestamp(),

            updatedAt: serverTimestamp()

        });

    }
}


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(auth, async (user) => {

    currentUser = user;

    if (user) {

        try {

            await createCustomerProfile();

            updateAuthButton();

            loadCustomerWorks();

        } catch (error) {

            console.error(error);

        }

    } else {

        updateAuthButton();

    }

});


function updateAuthButton() {

    const button = $("authButton");

    if (!button) return;

    if (currentUser) {

        button.textContent = "My Account";

    } else {

        button.textContent = "Login";

    }
}


/* =========================================================
   SERVICE SELECT — 100 SERVICES
========================================================= */

function populateServices() {

    const select = $("serviceSelect");

    if (!select) return;

    select.innerHTML = "";

    const first = document.createElement("option");

    first.value = "";

    first.textContent = "Select service";

    select.appendChild(first);

    SERVICES.forEach(service => {

        const option = document.createElement("option");

        option.value = service;

        option.textContent = service;

        select.appendChild(option);

    });
}


/* =========================================================
   SERVICE CARD EVENTS
========================================================= */

function setupServiceCards() {

    document.querySelectorAll(".service-card").forEach(card => {

        card.addEventListener("click", () => {

            const service =
                card.dataset.service;

            openServiceRequest(service);

        });

    });

}


/* =========================================================
   OPEN SERVICE REQUEST
========================================================= */

function openServiceRequest(service = "") {

    selectedService = service;

    const select = $("serviceSelect");

    const text = $("selectedServiceText");

    if (select && service) {

        const exists =
            [...select.options]
                .some(option => option.value === service);

        if (exists) {
            select.value = service;
        }

    }

    if (text) {

        text.textContent = service

            ? `Requesting ${service}. Tell us what needs to be fixed.`

            : "Tell us what you need.";

    }

    openModal("serviceModal");
}


/* =========================================================
   LOCATION
========================================================= */

function getCurrentLocation() {

    if (!navigator.geolocation) {

        showToast(
            "Location is not supported on this device.",
            "error"
        );

        return;

    }

    showToast(
        "Getting your location...",
        "info"
    );

    navigator.geolocation.getCurrentPosition(

        async (position) => {

            selectedLocation = {

                latitude:
                    position.coords.latitude,

                longitude:
                    position.coords.longitude

            };

            await saveCustomerLocation();

            updateLocationUI();

            showToast(
                "Location updated successfully.",
                "success"
            );

        },

        (error) => {

            console.error(error);

            showToast(
                "Please allow location permission.",
                "error"
            );

        },

        {
            enableHighAccuracy: true,

            timeout: 15000,

            maximumAge: 30000
        }

    );
}


/* =========================================================
   SAVE CUSTOMER LOCATION
========================================================= */

async function saveCustomerLocation() {

    if (!currentUser || !selectedLocation) return;

    try {

        await updateDoc(
            doc(db, "customers", currentUser.uid),
            {

                latitude:
                    selectedLocation.latitude,

                longitude:
                    selectedLocation.longitude,

                updatedAt:
                    serverTimestamp()

            }
        );

    } catch (error) {

        console.error(
            "Location save error:",
            error
        );

    }
}


/* =========================================================
   LOCATION UI
========================================================= */

function updateLocationUI() {

    const locationText =
        $("locationText");

    const mapStatus =
        $("mapStatus");

    const nearbyCount =
        $("nearbyCount");

    if (locationText) {

        locationText.textContent =
            "Location Set";

    }

    if (mapStatus) {

        mapStatus.textContent =
            "Your location is ready";

    }

    if (nearbyCount) {

        nearbyCount.textContent =
            "Matching professionals";

    }
}


/* =========================================================
   MAP PLACEHOLDER
========================================================= */

function initializeMapUI() {

    const map =
        $("map");

    if (!map) return;

    /*
       Real map integration can be connected later.
       Customer location is still stored in Firestore.
    */

    map.dataset.mapReady = "true";
}


/* =========================================================
   PHOTO PREVIEW
========================================================= */

function setupPhotoUpload() {

    const input =
        $("servicePhoto");

    const preview =
        $("photoPreview");

    if (!input) return;

    input.addEventListener("change", () => {

        selectedPhotos =
            [...input.files];

        if (!preview) return;

        preview.innerHTML = "";

        selectedPhotos.forEach(file => {

            const reader =
                new FileReader();

            reader.onload = (event) => {

                const img =
                    document.createElement("img");

                img.src =
                    event.target.result;

                img.alt =
                    "Selected service photo";

                img.className =
                    "uploaded-photo-preview";

                preview.appendChild(img);

            };

            reader.readAsDataURL(file);

        });

    });

}


/* =========================================================
   UPLOAD SERVICE PHOTOS
========================================================= */

async function uploadServicePhotos(orderId) {

    if (!selectedPhotos.length) {

        return [];

    }

    const uploadedUrls = [];

    for (let i = 0; i < selectedPhotos.length; i++) {

        const file =
            selectedPhotos[i];

        if (!file.type.startsWith("image/")) {

            continue;

        }

        if (file.size > 5 * 1024 * 1024) {

            showToast(
                "One photo was larger than 5MB and skipped.",
                "error"
            );

            continue;

        }

        const fileName =
            `${Date.now()}_${i}_${file.name}`;

        const storageRef =
            ref(
                storage,
                `serviceRequests/${currentUser.uid}/${orderId}/${fileName}`
            );

        await uploadBytes(
            storageRef,
            file
        );

        const url =
            await getDownloadURL(storageRef);

        uploadedUrls.push(url);

    }

    return uploadedUrls;
}


/* =========================================================
   CREATE SERVICE REQUEST
========================================================= */

async function createServiceRequest(event) {

    event.preventDefault();

    if (isSubmittingOrder) return;

    isSubmittingOrder = true;

    try {

        await ensureAuthentication();

        const service =
            $("serviceSelect")?.value.trim();

        const description =
            $("problemDescription")?.value.trim();

        const address =
            $("serviceAddress")?.value.trim();

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


        /* -----------------------------------------
           CREATE ORDER
        ----------------------------------------- */

        const orderData = {

            customerId:
                currentUser.uid,

            customerName: "",

            customerPhone: "",

            customerEmail: "",

            service,

            description,

            address,

            customerLatitude:
                selectedLocation?.latitude ?? null,

            customerLongitude:
                selectedLocation?.longitude ?? null,

            photoUrls: [],

            status: "searching",

            workerId: null,

            workerName: null,

            workerPhone: null,

            workerPhoto: null,

            workerRating: null,

            workerService: null,

            acceptedAt: null,

            completedAt: null,

            cancelledAt: null,

            cancelReason: null,

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        const orderRef =
            await addDoc(
                collection(db, "serviceRequests"),
                orderData
            );

        currentOrderId =
            orderRef.id;


        /* -----------------------------------------
           UPLOAD PHOTOS AFTER ORDER CREATION
        ----------------------------------------- */

        const photoUrls =
            await uploadServicePhotos(
                currentOrderId
            );

        if (photoUrls.length) {

            await updateDoc(
                orderRef,
                {

                    photoUrls,

                    updatedAt:
                        serverTimestamp()

                }
            );

        }


        /* -----------------------------------------
           CLOSE FORM
        ----------------------------------------- */

        closeModal("serviceModal");

        clearServiceForm();


        /* -----------------------------------------
           SHOW SEARCHING
        ----------------------------------------- */

        showSearchingState(
            currentOrderId,
            service
        );


        /* -----------------------------------------
           START REALTIME LISTENER
        ----------------------------------------- */

        listenToCurrentOrder(
            currentOrderId
        );


        showToast(
            "Service request created.",
            "success"
        );


    } catch (error) {

        console.error(
            "Create order error:",
            error
        );

        showToast(
            "Unable to create service request.",
            "error"
        );

    } finally {

        isSubmittingOrder = false;

    }

}


/* =========================================================
   CLEAR SERVICE FORM
========================================================= */

function clearServiceForm() {

    const form =
        $("serviceForm");

    if (form) {
        form.reset();
    }

    selectedPhotos = [];

    selectedService = "";

    const preview =
        $("photoPreview");

    if (preview) {
        preview.innerHTML = "";
    }

}


/* =========================================================
   SEARCHING UI
========================================================= */

function showSearchingState(orderId, service) {

    const works =
        $("worksContainer");

    if (!works) return;

    works.innerHTML = `

        <div class="work-card searching-card">

            <div class="searching-animation">

                <div class="search-spinner"></div>

            </div>

            <span class="eyebrow">
                SERVICE REQUEST
            </span>

            <h3>
                Searching for a professional...
            </h3>

            <p>
                We are looking for an available
                ${escapeHTML(service)}
                professional near you.
            </p>

            <div class="order-status">

                <span class="status-dot"></span>

                Searching

            </div>

            <small>
                Order ID: ${escapeHTML(orderId)}
            </small>

            <button
                id="cancelSearchingButton"
                class="secondary-button"
                type="button"
            >
                Cancel Request
            </button>

        </div>
    `;


    const cancelButton =
        $("cancelSearchingButton");

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            () => cancelCurrentOrder()
        );

    }

}


/* =========================================================
   REALTIME ORDER LISTENER
========================================================= */

function listenToCurrentOrder(orderId) {

    if (currentOrderUnsubscribe) {

        currentOrderUnsubscribe();

        currentOrderUnsubscribe = null;

    }


    const orderRef =
        doc(
            db,
            "serviceRequests",
            orderId
        );


    currentOrderUnsubscribe =
        onSnapshot(

            orderRef,

            (snapshot) => {

                if (!snapshot.exists()) {

                    showToast(
                        "This service request no longer exists.",
                        "error"
                    );

                    return;
                }

                const order =
                    snapshot.data();

                renderOrderStatus(
                    orderId,
                    order
                );

            },

            (error) => {

                console.error(
                    "Order listener error:",
                    error
                );

            }

        );

}


/* =========================================================
   RENDER ORDER STATUS
========================================================= */

function renderOrderStatus(orderId, order) {

    if (!order) return;


    /* =============================================
       SEARCHING
    ============================================= */

    if (order.status === "searching") {

        showSearchingState(
            orderId,
            order.service
        );

        return;

    }


    /* =============================================
       ACCEPTED
    ============================================= */

    if (order.status === "accepted") {

        renderAcceptedOrder(
            orderId,
            order
        );

        return;

    }


    /* =============================================
       WORKER CANCELLED
    ============================================= */

    if (order.status === "worker_cancelled") {

        renderWorkerCancelled(
            orderId,
            order
        );

        return;

    }


    /* =============================================
       IN PROGRESS
    ============================================= */

    if (order.status === "in_progress") {

        renderInProgressOrder(
            orderId,
            order
        );

        return;

    }


    /* =============================================
       COMPLETED
    ============================================= */

    if (order.status === "completed") {

        renderCompletedOrder(
            orderId,
            order
        );

        return;

    }


    /* =============================================
       CUSTOMER CANCELLED
    ============================================= */

    if (order.status === "customer_cancelled") {

        renderCancelledOrder(
            orderId,
            order
        );

        return;

    }

}


/* =========================================================
   ACCEPTED ORDER
========================================================= */

function renderAcceptedOrder(orderId, order) {

    const works =
        $("worksContainer");

    if (!works) return;


    const workerName =
        order.workerName || "Professional";

    const workerPhone =
        order.workerPhone || "";

    const workerRating =
        order.workerRating ?? "New";

    works.innerHTML = `

        <div class="work-card accepted-card">

            <div class="order-success">
                ✓
            </div>

            <span class="eyebrow">
                PROFESSIONAL FOUND
            </span>

            <h3>
                ${escapeHTML(workerName)}
                accepted your request
            </h3>

            <div class="order-status accepted-status">
                <span class="status-dot"></span>
                Accepted
            </div>


            <div class="worker-details">

                <h4>
                    Worker Details
                </h4>

                <div class="detail-row">

                    <strong>Name</strong>

                    <span>
                        ${escapeHTML(workerName)}
                    </span>

                </div>

                <div class="detail-row">

                    <strong>Service</strong>

                    <span>
                        ${escapeHTML(
                            order.workerService ||
                            order.service ||
                            ""
                        )}
                    </span>

                </div>

                <div class="detail-row">

                    <strong>Rating</strong>

                    <span>
                        ⭐ ${escapeHTML(
                            String(workerRating)
                        )}
                    </span>

                </div>

                ${
                    workerPhone
                    ? `
                    <div class="detail-row">

                        <strong>Phone</strong>

                        <span>
                            ${escapeHTML(workerPhone)}
                        </span>

                    </div>
                    `
                    : ""
                }

            </div>


            ${
                workerPhone
                ? `
                <a
                    class="primary-button full"
                    href="tel:${escapeHTML(workerPhone)}"
                >
                    📞 Call Professional
                </a>
                `
                : `
                <div class="form-safety">
                    Worker contact details will appear here
                    when available.
                </div>
                `
            }


            <div class="job-details">

                <h4>
                    Your Work
                </h4>

                <p>
                    <strong>Service:</strong>
                    ${escapeHTML(order.service || "")}
                </p>

                <p>
                    <strong>Problem:</strong>
                    ${escapeHTML(order.description || "")}
                </p>

                <p>
                    <strong>Location:</strong>
                    ${escapeHTML(order.address || "")}
                </p>

            </div>


            <button
                id="cancelAcceptedOrderButton"
                class="secondary-button full"
                type="button"
            >
                Cancel Request
            </button>

        </div>
    `;


    const cancelButton =
        $("cancelAcceptedOrderButton");

    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            () => cancelCurrentOrder()
        );

    }

}


/* =========================================================
   WORKER CANCELLED
========================================================= */

function renderWorkerCancelled(orderId, order) {

    const works =
        $("worksContainer");

    if (!works) return;

    works.innerHTML = `

        <div class="work-card">

            <div class="order-warning">
                ⚠️
            </div>

            <h3>
                Professional cancelled
            </h3>

            <p>
                The professional could not take this work.
                You can try booking again.
            </p>

            <button
                id="retryServiceButton"
                class="primary-button"
                type="button"
            >
                Try Again
            </button>

        </div>
    `;


    const retry =
        $("retryServiceButton");

    if (retry) {

        retry.addEventListener(
            "click",
            () => {

                openServiceRequest(
                    order.service
                );

            }
        );

    }

}


/* =========================================================
   IN PROGRESS
========================================================= */

function renderInProgressOrder(orderId, order) {

    const works =
        $("worksContainer");

    if (!works) return;

    works.innerHTML = `

        <div class="work-card">

            <div class="order-success">
                🔧
            </div>

            <span class="eyebrow">
                WORK IN PROGRESS
            </span>

            <h3>
                ${escapeHTML(
                    order.workerName ||
                    "Professional"
                )}
                is working on your request.
            </h3>

            <div class="order-status">
                <span class="status-dot"></span>
                Work in progress
            </div>

            ${
                order.workerPhone
                ? `
                <a
                    class="primary-button full"
                    href="tel:${escapeHTML(
                        order.workerPhone
                    )}"
                >
                    📞 Call Professional
                </a>
                `
                : ""
            }

            <div class="job-details">

                <p>
                    <strong>Service:</strong>
                    ${escapeHTML(order.service || "")}
                </p>

                <p>
                    <strong>Problem:</strong>
                    ${escapeHTML(order.description || "")}
                </p>

            </div>

        </div>
    `;

}


/* =========================================================
   COMPLETED
========================================================= */

function renderCompletedOrder(orderId, order) {

    const works =
        $("worksContainer");

    if (!works) return;

    works.innerHTML = `

        <div class="work-card">

            <div class="order-success">
                ✓
            </div>

            <span class="eyebrow">
                COMPLETED
            </span>

            <h3>
                Work completed successfully
            </h3>

            <p>
                ${escapeHTML(
                    order.workerName ||
                    "Professional"
                )}
                completed your
                ${escapeHTML(
                    order.service || "service"
                )}
                request.
            </p>

            <div class="order-status">
                <span class="status-dot"></span>
                Completed
            </div>

            <button
                id="newServiceAfterComplete"
                class="primary-button"
                type="button"
            >
                Book Another Service
            </button>

        </div>
    `;


    const button =
        $("newServiceAfterComplete");

    if (button) {

        button.addEventListener(
            "click",
            () => openServiceRequest()
        );

    }

}


/* =========================================================
   CUSTOMER CANCELLED
========================================================= */

function renderCancelledOrder(orderId, order) {

    const works =
        $("worksContainer");

    if (!works) return;

    works.innerHTML = `

        <div class="work-card">

            <div class="order-warning">
                ✕
            </div>

            <h3>
                Service request cancelled
            </h3>

            <p>
                This request has been cancelled.
            </p>

            <button
                id="bookAgainButton"
                class="primary-button"
                type="button"
            >
                Book Again
            </button>

        </div>
    `;


    const button =
        $("bookAgainButton");

    if (button) {

        button.addEventListener(
            "click",
            () => openServiceRequest(
                order.service
            )
        );

    }

}


/* =========================================================
   CANCEL CURRENT ORDER
========================================================= */

async function cancelCurrentOrder() {

    if (!currentOrderId) {

        showToast(
            "No active request found.",
            "error"
        );

        return;

    }

    if (!currentUser) return;


    const confirmed =
        confirm(
            "Are you sure you want to cancel this service request?"
        );

    if (!confirmed) return;


    try {

        await updateDoc(

            doc(
                db,
                "serviceRequests",
                currentOrderId
            ),

            {

                status:
                    "customer_cancelled",

                cancelledAt:
                    serverTimestamp(),

                cancelReason:
                    "Cancelled by customer",

                updatedAt:
                    serverTimestamp()

            }

        );


        showToast(
            "Service request cancelled.",
            "success"
        );


    } catch (error) {

        console.error(
            "Cancel error:",
            error
        );

        showToast(
            "Unable to cancel request.",
            "error"
        );

    }

}


/* =========================================================
   MY WORKS / HISTORY
========================================================= */

function loadCustomerWorks() {

    if (!currentUser) return;


    if (currentHistoryUnsubscribe) {

        currentHistoryUnsubscribe();

        currentHistoryUnsubscribe = null;

    }


    const worksQuery =
        query(

            collection(
                db,
                "serviceRequests"
            ),

            where(
                "customerId",
                "==",
                currentUser.uid
            ),

            orderBy(
                "createdAt",
                "desc"
            ),

            limit(50)

        );


    currentHistoryUnsubscribe =
        onSnapshot(

            worksQuery,

            (snapshot) => {

                if (
                    snapshot.empty &&
                    !currentOrderId
                ) {

                    showEmptyWorks();

                    return;

                }


                const orders =
                    snapshot.docs.map(
                        document => ({

                            id: document.id,

                            ...document.data()

                        })
                    );


                renderWorksHistory(
                    orders
                );

            },

            (error) => {

                console.error(
                    "History error:",
                    error
                );

                /*
                   If composite index is not yet created,
                   the live order listener still works.
                */

            }

        );

}


/* =========================================================
   EMPTY WORKS
========================================================= */

function showEmptyWorks() {

    const works =
        $("worksContainer");

    if (!works) return;

    works.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">
                📋
            </div>

            <h3>
                No completed works
            </h3>

            <p>
                Your service requests and completed works
                will appear here.
            </p>

            <button
                id="emptyRequestButton"
                class="primary-button"
                type="button"
            >
                Request a Service
            </button>

        </div>
    `;


    const button =
        $("emptyRequestButton");

    if (button) {

        button.addEventListener(
            "click",
            () => openServiceRequest()
        );

    }

}


/* =========================================================
   WORKS HISTORY
========================================================= */

function renderWorksHistory(orders) {

    const works =
        $("worksContainer");

    if (!works) return;


    /*
       If there is an active current order,
       keep its realtime status UI.
    */

    if (currentOrderId) {

        const active =
            orders.find(
                order =>
                    order.id === currentOrderId &&
                    [
                        "searching",
                        "accepted",
                        "in_progress"
                    ].includes(order.status)
            );

        if (active) {

            renderOrderStatus(
                active.id,
                active
            );

            return;

        }

    }


    const completed =
        orders.filter(order =>
            [
                "completed",
                "customer_cancelled",
                "worker_cancelled"
            ].includes(order.status)
        );


    if (!completed.length) {

        if (!currentOrderId) {

            showEmptyWorks();

        }

        return;

    }


    works.innerHTML = `

        <div class="works-history">

            ${completed.map(order => `

                <div class="history-card">

                    <div class="history-top">

                        <strong>
                            ${escapeHTML(
                                order.service || "Service"
                            )}
                        </strong>

                        <span class="history-status">
                            ${formatStatus(
                                order.status
                            )}
                        </span>

                    </div>

                    <p>
                        ${escapeHTML(
                            order.description || ""
                        )}
                    </p>

                    <small>
                        ${escapeHTML(
                            order.address || ""
                        )}
                    </small>

                    ${
                        order.workerName
                        ? `
                        <div class="history-worker">
                            Professional:
                            ${escapeHTML(
                                order.workerName
                            )}
                        </div>
                        `
                        : ""
                    }

                    ${
                        order.id
                        ? `
                        <small>
                            Order ID:
                            ${escapeHTML(order.id)}
                        </small>
                        `
                        : ""
                    }

                </div>

            `).join("")}

        </div>
    `;

}


/* =========================================================
   STATUS FORMAT
========================================================= */

function formatStatus(status) {

    const statuses = {

        completed: "Completed",

        customer_cancelled:
            "Cancelled by customer",

        worker_cancelled:
            "Professional cancelled",

        accepted:
            "Accepted",

        in_progress:
            "In Progress",

        searching:
            "Searching"

    };

    return statuses[status] || status;

}


/* =========================================================
   AUTH MODAL
========================================================= */

function setupAuthButton() {

    const button =
        $("authButton");

    if (!button) return;


    button.addEventListener(
        "click",
        async () => {

            if (currentUser) {

                showAccountInfo();

                return;

            }

            openModal("authModal");

        }
    );

}


/* =========================================================
   ACCOUNT INFO
========================================================= */

async function showAccountInfo() {

    if (!currentUser) return;


    try {

        const customer =
            await getDoc(
                doc(
                    db,
                    "customers",
                    currentUser.uid
                )
            );


        const data =
            customer.exists()
                ? customer.data()
                : {};


        const name =
            data.name || "Customer";


        const email =
            data.email || "Not added";


        const phone =
            data.phone || "Not added";


        const logout =
            confirm(
                `FIX MY WORK Account\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nPress OK to logout.`
            );


        if (logout) {

            await signOut(auth);

            currentOrderId = null;

            if (currentOrderUnsubscribe) {

                currentOrderUnsubscribe();

                currentOrderUnsubscribe = null;

            }

            showToast(
                "You have been logged out.",
                "success"
            );

        }

    } catch (error) {

        console.error(error);

    }

}


/* =========================================================
   AUTH FORM
========================================================= */

function setupAuthForm() {

    const form =
        $("authForm");

    if (!form) return;


    form.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            try {

                await ensureAuthentication();

                const email =
                    $("authEmail")?.value.trim();


                if (email) {

                    await updateDoc(

                        doc(
                            db,
                            "customers",
                            currentUser.uid
                        ),

                        {

                            email,

                            updatedAt:
                                serverTimestamp()

                        }

                    );

                }


                closeModal("authModal");

                showToast(
                    "You are connected to FIX MY WORK.",
                    "success"
                );


            } catch (error) {

                console.error(error);

                showToast(
                    "Login failed. Please try again.",
                    "error"
                );

            }

        }
    );

}


/* =========================================================
   CLOSE MODALS
========================================================= */

function setupModalClosing() {

    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    closeModal(
                        button.dataset.closeModal
                    );

                }
            );

        });


    document
        .querySelectorAll(".modal")
        .forEach(modal => {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target === modal
                    ) {

                        modal.classList.add(
                            "hidden"
                        );

                    }

                }
            );

        });

}


/* =========================================================
   REQUEST BUTTONS
========================================================= */

function setupRequestButtons() {

    const request =
        $("requestServiceButton");

    if (request) {

        request.addEventListener(
            "click",
            () => openServiceRequest()
        );

    }


    const emptyRequest =
        $("emptyRequestButton");

    if (emptyRequest) {

        emptyRequest.addEventListener(
            "click",
            () => openServiceRequest()
        );

    }


    const viewAllServices =
        $("viewAllServices");

    if (viewAllServices) {

        viewAllServices.addEventListener(
            "click",
            () => {

                const section =
                    $("services");

                section?.scrollIntoView({
                    behavior: "smooth"
                });

            }
        );

    }

}


/* =========================================================
   LOCATION BUTTONS
========================================================= */

function setupLocationButtons() {

    const locationButton =
        $("locationButton");

    if (locationButton) {

        locationButton.addEventListener(
            "click",
            getCurrentLocation
        );

    }


    const useLocationButton =
        $("useLocationButton");

    if (useLocationButton) {

        useLocationButton.addEventListener(
            "click",
            getCurrentLocation
        );

    }

}


/* =========================================================
   SAFETY NOTICE
========================================================= */

function setupSafetyNotice() {

    const close =
        $("closeSafety");

    const notice =
        $("safetyNotice");

    if (
        close &&
        notice
    ) {

        close.addEventListener(
            "click",
            () => {

                notice.style.display =
                    "none";

            }
        );

    }

}


/* =========================================================
   SUPPORT
========================================================= */

function setupSupport() {

    const support =
        $("supportButton");

    if (!support) return;

    support.addEventListener(
        "click",
        () => {

            window.location.href =
                "mailto:fixmywork6734@gmail.com";

        }
    );

}


/* =========================================================
   MENU
========================================================= */

function setupMenu() {

    const menu =
        $("menuButton");

    const nav =
        document.querySelector(".desktop-nav");

    if (!menu || !nav) return;

    menu.addEventListener(
        "click",
        () => {

            const open =
                menu.getAttribute(
                    "aria-expanded"
                ) === "true";

            menu.setAttribute(
                "aria-expanded",
                String(!open)
            );

            nav.classList.toggle(
                "mobile-nav-open"
            );

        }
    );

}


/* =========================================================
   SERVICE FORM
========================================================= */

function setupServiceForm() {

    const form =
        $("serviceForm");

    if (!form) return;

    form.addEventListener(
        "submit",
        createServiceRequest
    );


    const select =
        $("serviceSelect");

    if (select) {

        select.addEventListener(
            "change",
            () => {

                selectedService =
                    select.value;

                const text =
                    $("selectedServiceText");

                if (text) {

                    text.textContent =
                        selectedService

                        ? `Requesting ${selectedService}. Tell us what needs to be fixed.`

                        : "Tell us what you need.";

                }

            }
        );

    }

}


/* =========================================================
   YEAR
========================================================= */

function setCurrentYear() {

    const year =
        $("currentYear");

    if (year) {

        year.textContent =
            new Date().getFullYear();

    }

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    if (value === null ||
        value === undefined) {

        return "";

    }

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");

}


/* =========================================================
   CLEANUP ON PAGE HIDE
========================================================= */

window.addEventListener(
    "pagehide",
    () => {

        if (currentOrderUnsubscribe) {

            currentOrderUnsubscribe();

            currentOrderUnsubscribe = null;

        }

        if (currentHistoryUnsubscribe) {

            currentHistoryUnsubscribe();

            currentHistoryUnsubscribe = null;

        }

    }
);


/* =========================================================
   APPLICATION START
========================================================= */

async function initializeApplication() {

    console.log(
        "FIX MY WORK customer application starting..."
    );


    populateServices();

    setupServiceCards();

    setupPhotoUpload();

    setupServiceForm();

    setupAuthButton();

    setupAuthForm();

    setupModalClosing();

    setupRequestButtons();

    setupLocationButtons();

    setupSafetyNotice();

    setupSupport();

    setupMenu();

    initializeMapUI();

    setCurrentYear();


    try {

        await ensureAuthentication();

        console.log(
            "FIX MY WORK customer backend connected."
        );

    } catch (error) {

        console.error(
            "Application initialization error:",
            error
        );

    }

}


/* =========================================================
   START
========================================================= */

initializeApplication();
