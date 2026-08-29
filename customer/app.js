/* =========================================================
   FIX MY WORK
   CUSTOMER APP
   Fresh production-structure version
   ========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================================================
   FIREBASE
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

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =========================================================
   CLOUDINARY
   ========================================================= */

const CLOUDINARY_CLOUD_NAME = "lqfozcs3";

const CLOUDINARY_UPLOAD_PRESET = "fixmywork_upload";


/* =========================================================
   EXACTLY 100 SERVICES
   ========================================================= */

const SERVICES = [
    "Electrical",
    "Plumbing",
    "AC Repair",
    "RO Repair",
    "Washing Machine Repair",
    "Refrigerator Repair",
    "TV Repair",
    "Microwave Repair",
    "Geyser Repair",
    "Dishwasher Repair",
    "Chimney Repair",
    "Water Purifier Installation",
    "Water Purifier Service",
    "Water Tank Cleaning",
    "Bathroom Cleaning",
    "Home Deep Cleaning",
    "Sofa Cleaning",
    "Carpet Cleaning",
    "Kitchen Cleaning",
    "Pest Control",
    "Termite Control",
    "Carpenter",
    "Furniture Repair",
    "Furniture Assembly",
    "Modular Kitchen Repair",
    "Door Repair",
    "Window Repair",
    "Lock Repair",
    "Locksmith",
    "Painting",
    "Wall Painting",
    "Texture Painting",
    "Waterproofing",
    "False Ceiling",
    "POP Work",
    "Tile Work",
    "Marble Work",
    "Granite Work",
    "Glass Work",
    "Aluminium Work",
    "Welding",
    "Masonry",
    "Brick Work",
    "Plastering",
    "Roofing",
    "Electrical Wiring",
    "Switchboard Repair",
    "Fan Repair",
    "Light Installation",
    "Inverter Repair",
    "Battery Service",
    "Solar Panel Service",
    "Solar Water Heater Service",
    "CCTV Installation",
    "CCTV Repair",
    "Wi-Fi Installation",
    "Internet Troubleshooting",
    "DTH Service",
    "Computer Repair",
    "Laptop Repair",
    "Printer Repair",
    "Mobile Repair",
    "Tablet Repair",
    "Data Recovery",
    "UPS Repair",
    "Generator Service",
    "AC Installation",
    "AC Gas Filling",
    "AC Maintenance",
    "AC Cleaning",
    "Bike Repair",
    "Car Repair",
    "Car Wash",
    "Car AC Repair",
    "Tyre Service",
    "Battery Replacement",
    "Car Towing",
    "Bike Towing",
    "Packers & Movers",
    "Furniture Shifting",
    "Gardening",
    "Lawn Maintenance",
    "Plant Care",
    "Water Pump Repair",
    "Borewell Motor Repair",
    "Plumbing Installation",
    "Drain Cleaning",
    "Kitchen Plumbing",
    "Bathroom Plumbing",
    "Bathroom Fitting",
    "Gas Stove Repair",
    "Gas Pipeline Service",
    "RO AMC Service",
    "Home Appliance Installation",
    "Smart TV Installation",
    "Home Theatre Installation",
    "Intercom Installation",
    "Security Alarm Installation",
    "Solar Inverter Service",
    "Home Maintenance Inspection"
];

if (SERVICES.length !== 100) {
    throw new Error(
        `FIX MY WORK service catalogue must contain exactly 100 services. Found ${SERVICES.length}.`
    );
}


/* =========================================================
   STATE
   ========================================================= */

let currentUser = null;

let customerProfile = null;

let isSignupMode = false;

let currentRequestUnsubscribe = null;

let worksUnsubscribe = null;

let currentRequestId = null;

let currentLocation = {
    latitude: null,
    longitude: null,
    address: ""
};


/* =========================================================
   DOM
   ========================================================= */

const $ = (id) => document.getElementById(id);

const authModal = $("authModal");

const serviceModal = $("serviceModal");

const policyModal = $("policyModal");

const authForm = $("authForm");

const serviceForm = $("serviceForm");

const serviceGrid = $("serviceGrid");

const serviceSelect = $("serviceSelect");

const activeRequestSection = $("activeRequestSection");

const activeRequestContainer = $("activeRequestContainer");

const worksContainer = $("worksContainer");

const toastContainer = $("toastContainer");


/* =========================================================
   UTILITIES
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


function validMobile(value) {

    return /^[6-9]\d{9}$/.test(
        String(value || "").trim()
    );
}


function formatDate(timestamp) {

    if (!timestamp) {
        return "Recently";
    }

    try {

        const date = timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);

        return date.toLocaleString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    } catch {

        return "Recently";
    }
}


function openModal(modal) {

    modal?.classList.remove("hidden");

    document.body.style.overflow = "hidden";
}


function closeModal(modal) {

    modal?.classList.add("hidden");

    document.body.style.overflow = "";
}


function closeAllModals() {

    closeModal(authModal);

    closeModal(serviceModal);

    closeModal(policyModal);
}


/* =========================================================
   MODALS
   ========================================================= */

document.querySelectorAll("[data-close]").forEach((button) => {

    button.addEventListener("click", () => {

        closeModal(
            $(button.dataset.close)
        );

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

    if (event.key === "Escape") {
        closeAllModals();
    }

});


/* =========================================================
   SERVICES
   ========================================================= */

function buildServices() {

    if (!serviceGrid || !serviceSelect) {
        return;
    }

    serviceGrid.innerHTML = "";

    serviceSelect.innerHTML = `
        <option value="">
            Select one of 100 services
        </option>
    `;

    SERVICES.forEach((service, index) => {

        const card = document.createElement("button");

        card.type = "button";

        card.className = "service-card";

        card.dataset.service = service;

        card.innerHTML = `
            <span class="service-icon">
                ${getServiceIcon(service)}
            </span>

            <strong>
                ${escapeHTML(service)}
            </strong>

            <small>
                Professional service
            </small>
        `;

        card.addEventListener("click", () => {

            if (!currentUser) {
                openLogin();
                showToast(
                    "Please login before booking a service.",
                    "error"
                );
                return;
            }

            openServiceModal(service);

        });

        serviceGrid.appendChild(card);


        const option = document.createElement("option");

        option.value = service;

        option.textContent = `${index + 1}. ${service}`;

        serviceSelect.appendChild(option);

    });

    const serviceCount = $("serviceCount");

    if (serviceCount) {
        serviceCount.textContent =
            `${SERVICES.length} services`;
    }
}


function getServiceIcon(service) {

    const icons = {

        "Electrical": "⚡",
        "Plumbing": "🔧",
        "AC Repair": "❄️",
        "RO Repair": "💧",
        "Washing Machine Repair": "🧺",
        "Refrigerator Repair": "🧊",
        "TV Repair": "📺",
        "Microwave Repair": "🍽️",
        "Geyser Repair": "🚿",
        "Dishwasher Repair": "🍽️",
        "Carpenter": "🪚",
        "Painting": "🎨",
        "Pest Control": "🐜",
        "Gardening": "🌱",
        "CCTV Installation": "📷",
        "Computer Repair": "💻",
        "Laptop Repair": "💻",
        "Mobile Repair": "📱",
        "Car Repair": "🚗",
        "Bike Repair": "🏍️",
        "Car Wash": "🚿",
        "Packers & Movers": "📦",
        "Home Deep Cleaning": "🧹",
        "Waterproofing": "🏠",
        "Welding": "🧰"
    };

    return icons[service] || "🛠️";
}


/* =========================================================
   AUTH UI
   ========================================================= */

function openLogin() {

    isSignupMode = false;

    updateAuthUI();

    openModal(authModal);
}


function openSignup() {

    isSignupMode = true;

    updateAuthUI();

    openModal(authModal);
}


function updateAuthUI() {

    const title = $("authTitle");

    const subtitle = $("authSubtitle");

    const submit = $("authSubmit");

    const modeButton = $("authModeButton");

    const profileGroup = $("profilePhotoGroup");

    const name = $("authName");

    const mobile = $("authMobile");

    if (isSignupMode) {

        title.textContent =
            "Create Customer Account";

        subtitle.textContent =
            "Create your FIX MY WORK customer account.";

        submit.textContent =
            "Create Account";

        modeButton.textContent =
            "Already have an account? Login";

        profileGroup?.classList.remove("hidden");

        if (name) {
            name.required = true;
        }

        if (mobile) {
            mobile.required = true;
        }

    } else {

        title.textContent =
            "Login";

        subtitle.textContent =
            "Login to book and track services.";

        submit.textContent =
            "Login";

        modeButton.textContent =
            "Create a new account";

        profileGroup?.classList.add("hidden");

        if (name) {
            name.required = false;
        }

        if (mobile) {
            mobile.required = false;
        }
    }
}


/* =========================================================
   AUTH BUTTON
   ========================================================= */

$("authButton")?.addEventListener(
    "click",
    () => {

        if (currentUser) {

            showAccountMenu();

        } else {

            openLogin();

        }

    }
);


$("authModeButton")?.addEventListener(
    "click",
    () => {

        isSignupMode = !isSignupMode;

        updateAuthUI();

    }
);


/* =========================================================
   ACCOUNT MENU
   ========================================================= */

function showAccountMenu() {

    const name =
        customerProfile?.name ||
        currentUser?.email ||
        "Customer";

    const choice =
        window.confirm(
            `${name}\n\nOK = My Profile\nCancel = Logout`
        );

    if (choice) {

        openSignup();

        const authName = $("authName");

        const authMobile = $("authMobile");

        const authEmail = $("authEmail");

        if (authName) {
            authName.value =
                customerProfile?.name || "";
        }

        if (authMobile) {
            authMobile.value =
                customerProfile?.mobile || "";
        }

        if (authEmail) {
            authEmail.value =
                currentUser.email || "";
            authEmail.disabled = true;
        }

        showToast(
            "Your profile details are shown here."
        );

    } else {

        signOut(auth)
            .catch((error) => {
                console.error(error);
            });

    }
}


/* =========================================================
   LOGIN / SIGNUP
   ========================================================= */

authForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const email =
            $("authEmail")?.value
                .trim()
                .toLowerCase();

        const password =
            $("authPassword")?.value || "";

        if (!email || !password) {

            showToast(
                "Email and password are required.",
                "error"
            );

            return;
        }


        const button = $("authSubmit");

        if (button) {
            button.disabled = true;
            button.textContent =
                isSignupMode
                    ? "Creating account..."
                    : "Logging in...";
        }


        try {

            if (isSignupMode) {

                const name =
                    $("authName")?.value.trim();

                const mobile =
                    $("authMobile")?.value.trim();

                if (!name) {
                    throw new Error(
                        "Please enter your full name."
                    );
                }

                if (!validMobile(mobile)) {
                    throw new Error(
                        "Please enter a valid 10 digit mobile number."
                    );
                }


                const credential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                await updateProfile(
                    credential.user,
                    {
                        displayName: name
                    }
                );


                let profilePhoto = "";

                const photoFile =
                    $("authPhoto")?.files?.[0];

                if (photoFile) {

                    const uploaded =
                        await uploadImageToCloudinary(
                            photoFile
                        );

                    profilePhoto =
                        uploaded.url;

                    await updateProfile(
                        credential.user,
                        {
                            photoURL: profilePhoto
                        }
                    );
                }


                await setDoc(
                    doc(
                        db,
                        "customers",
                        credential.user.uid
                    ),
                    {
                        uid: credential.user.uid,
                        role: "customer",
                        name,
                        email,
                        mobile,
                        profilePhoto,
                        createdAt:
                            serverTimestamp(),
                        updatedAt:
                            serverTimestamp()
                    },
                    {
                        merge: true
                    }
                );


                showToast(
                    "Customer account created successfully.",
                    "success"
                );

            } else {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                showToast(
                    "Login successful.",
                    "success"
                );
            }


            closeModal(authModal);

            authForm.reset();

        } catch (error) {

            console.error(
                "Authentication error:",
                error
            );

            showToast(
                getFirebaseErrorMessage(error),
                "error"
            );

        } finally {

            if (button) {

                button.disabled = false;

                button.textContent =
                    isSignupMode
                        ? "Create Account"
                        : "Login";

            }

        }

    }
);


/* =========================================================
   PASSWORD RESET
   ========================================================= */

$("forgotPasswordButton")?.addEventListener(
    "click",
    async () => {

        const email =
            $("authEmail")?.value
                .trim()
                .toLowerCase();

        if (!email) {

            showToast(
                "Enter your email first.",
                "error"
            );

            return;
        }

        try {

            await sendPasswordResetEmail(
                auth,
                email
            );

            showToast(
                "Password reset email sent.",
                "success"
            );

        } catch (error) {

            console.error(error);

            showToast(
                getFirebaseErrorMessage(error),
                "error"
            );

        }

    }
);


/* =========================================================
   FIREBASE ERROR MESSAGES
   ========================================================= */

function getFirebaseErrorMessage(error) {

    const code = error?.code || "";

    const messages = {

        "auth/email-already-in-use":
            "This email already has an account.",

        "auth/invalid-email":
            "Please enter a valid email address.",

        "auth/weak-password":
            "Password must be at least 6 characters.",

        "auth/invalid-credential":
            "Incorrect email or password.",

        "auth/user-not-found":
            "Account not found.",

        "auth/wrong-password":
            "Incorrect email or password.",

        "auth/too-many-requests":
            "Too many attempts. Please try again later.",

        "auth/network-request-failed":
            "Network problem. Check your internet connection."

    };

    return messages[code] ||
        error?.message ||
        "Something went wrong. Please try again.";
}


/* =========================================================
   AUTH STATE
   ========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        currentUser = user;

        if (!user) {

            customerProfile = null;

            $("authButton").textContent =
                "Login";

            stopCustomerListeners();

            renderCompletedWorks([]);

            return;
        }


        $("authButton").textContent =
            "My Account";


        await loadCustomerProfile(
            user.uid
        );


        startCustomerListeners(
            user.uid
        );

    }
);


/* =========================================================
   CUSTOMER PROFILE
   ========================================================= */

async function loadCustomerProfile(uid) {

    try {

        const profileSnapshot =
            await getDoc(
                doc(
                    db,
                    "customers",
                    uid
                )
            );

        if (profileSnapshot.exists()) {

            customerProfile =
                profileSnapshot.data();

        } else {

            customerProfile = {
                uid,
                role: "customer",
                name:
                    currentUser?.displayName || "",
                email:
                    currentUser?.email || "",
                mobile: "",
                profilePhoto:
                    currentUser?.photoURL || ""
            };

            await setDoc(
                doc(
                    db,
                    "customers",
                    uid
                ),
                {
                    ...customerProfile,
                    createdAt:
                        serverTimestamp(),
                    updatedAt:
                        serverTimestamp()
                },
                {
                    merge: true
                }
            );
        }


        const bookingMobile =
            $("bookingMobile");

        if (
            bookingMobile &&
            customerProfile.mobile
        ) {
            bookingMobile.value =
                customerProfile.mobile;
        }

    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );

    }
}


/* =========================================================
   SERVICE MODAL
   ========================================================= */

$("requestButton")?.addEventListener(
    "click",
    () => {

        if (!currentUser) {

            openLogin();

            showToast(
                "Please login before booking.",
                "error"
            );

            return;
        }

        openServiceModal();

    }
);


function openServiceModal(service = "") {

    if (!currentUser) {

        openLogin();

        return;
    }

    if (serviceSelect) {

        serviceSelect.value =
            SERVICES.includes(service)
                ? service
                : "";

    }

    const mobile =
        $("bookingMobile");

    if (
        mobile &&
        customerProfile?.mobile
    ) {

        mobile.value =
            customerProfile.mobile;

    }

    openModal(serviceModal);
}


/* =========================================================
   SERVICE FORM
   ========================================================= */

serviceForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        if (!currentUser) {

            showToast(
                "Please login first.",
                "error"
            );

            return;
        }


        const service =
            serviceSelect?.value.trim();

        const mobile =
            $("bookingMobile")?.value.trim();

        const description =
            $("problemDescription")?.value.trim();

        const address =
            $("serviceAddress")?.value.trim();


        if (!SERVICES.includes(service)) {

            showToast(
                "Please select a valid service.",
                "error"
            );

            return;
        }


        if (!validMobile(mobile)) {

            showToast(
                "Enter a valid 10 digit mobile number.",
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
                "Please enter the service address.",
                "error"
            );

            return;
        }


        const submit =
            serviceForm.querySelector(
                'button[type="submit"]'
            );


        try {

            if (submit) {

                submit.disabled = true;

                submit.textContent =
                    "Creating Request...";
            }


            const files =
                $("servicePhotos")?.files || [];


            let photos = [];


            if (files.length) {

                if (submit) {
                    submit.textContent =
                        "Uploading Photos...";
                }

                photos =
                    await uploadServicePhotos(
                        files
                    );
            }


            if (submit) {
                submit.textContent =
                    "Sending Request...";
            }


            const requestData = {

                customerId:
                    currentUser.uid,

                customerName:
                    customerProfile?.name ||
                    currentUser.displayName ||
                    "",

                customerEmail:
                    currentUser.email || "",

                customerMobile:
                    mobile,

                customerPhoto:
                    customerProfile?.profilePhoto ||
                    currentUser.photoURL ||
                    "",

                service,

                description,

                address,

                latitude:
                    currentLocation.latitude,

                longitude:
                    currentLocation.longitude,

                photos,

                status: "searching",

                assignedWorkerId: null,

                assignedAt: null,

                workerName: null,

                workerPhone: null,

                workerPhoto: null,

                workerRating: null,

                workerServices: [],

                completionPhotos: [],

                customerRating: null,

                customerFeedback: null,

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()
            };


            const requestRef =
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
                    uid:
                        currentUser.uid,

                    role: "customer",

                    name:
                        customerProfile?.name ||
                        currentUser.displayName ||
                        "",

                    email:
                        currentUser.email || "",

                    mobile,

                    profilePhoto:
                        customerProfile?.profilePhoto ||
                        currentUser.photoURL ||
                        "",

                    updatedAt:
                        serverTimestamp()
                },
                {
                    merge: true
                }
            );


            currentRequestId =
                requestRef.id;


            closeModal(serviceModal);

            serviceForm.reset();

            currentLocation.address = "";

            currentLocation.latitude = null;

            currentLocation.longitude = null;


            showToast(
                "Request booked. Searching for a professional...",
                "success"
            );


            listenToCurrentRequest(
                requestRef.id
            );


            document
                .getElementById(
                    "activeRequestSection"
                )
                ?.scrollIntoView({
                    behavior: "smooth"
                });


        } catch (error) {

            console.error(
                "Request creation error:",
                error
            );

            showToast(
                "Could not create the request. Please try again.",
                "error"
            );

        } finally {

            if (submit) {

                submit.disabled = false;

                submit.textContent =
                    "Book Service";

            }

        }

    }
);


/* =========================================================
   CLOUDINARY
   ========================================================= */

async function uploadImageToCloudinary(file) {

    const url =
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;


    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
    );


    const response =
        await fetch(
            url,
            {
                method: "POST",
                body: formData
            }
        );


    if (!response.ok) {

        throw new Error(
            "Image upload failed."
        );

    }


    const result =
        await response.json();


    return {

        url:
            result.secure_url,

        publicId:
            result.public_id

    };
}


async function uploadServicePhotos(files) {

    const validFiles =
        Array.from(files)
            .filter(
                (file) =>
                    file.type.startsWith("image/")
            )
            .slice(0, 6);


    const results = [];


    for (
        const file of validFiles
    ) {

        const uploaded =
            await uploadImageToCloudinary(
                file
            );

        results.push(uploaded);

    }


    return results;
}


/* =========================================================
   PHOTO PREVIEW
   ========================================================= */

$("servicePhotos")?.addEventListener(
    "change",
    () => {

        const preview =
            $("photoPreview");

        if (!preview) {
            return;
        }

        preview.innerHTML = "";

        Array
            .from(
                $("servicePhotos").files || []
            )
            .slice(0, 6)
            .forEach((file) => {

                if (
                    !file.type.startsWith("image/")
                ) {
                    return;
                }

                const image =
                    document.createElement("img");

                const reader =
                    new FileReader();

                reader.onload = () => {

                    image.src =
                        reader.result;

                    preview.appendChild(
                        image
                    );

                };

                reader.readAsDataURL(file);

            });

    }
);


/* =========================================================
   CURRENT REQUEST LISTENER
   ========================================================= */

function listenToCurrentRequest(requestId) {

    if (currentRequestUnsubscribe) {

        currentRequestUnsubscribe();

        currentRequestUnsubscribe = null;
    }


    currentRequestId =
        requestId;


    activeRequestSection
        ?.classList
        .remove("hidden");


    const requestRef =
        doc(
            db,
            "serviceRequests",
            requestId
        );


    currentRequestUnsubscribe =
        onSnapshot(
            requestRef,
            (snapshot) => {

                if (!snapshot.exists()) {

                    activeRequestContainer.innerHTML = `
                        <div class="empty-card">
                            <h3>Request no longer available</h3>
                        </div>
                    `;

                    return;
                }


                const request = {
                    id:
                        snapshot.id,

                    ...snapshot.data()
                };


                renderActiveRequest(
                    request
                );

            },
            (error) => {

                console.error(
                    "Request listener error:",
                    error
                );

                showToast(
                    "Unable to update your request status.",
                    "error"
                );

            }
        );
}


/* =========================================================
   ACTIVE REQUEST RENDER
   ========================================================= */

function renderActiveRequest(request) {

    if (!activeRequestContainer) {
        return;
    }


    const status =
        request.status || "searching";


    if (
        status === "completed" ||
        status === "customer_cancelled"
    ) {

        activeRequestSection
            ?.classList
            .add("hidden");

        return;
    }


    if (
        status === "searching" ||
        status === "pending" ||
        status === "worker_cancelled"
    ) {

        activeRequestContainer.innerHTML = `

            <div class="request-card searching">

                <span class="request-status">
                    🔎 Searching for a Professional
                </span>

                <div class="search-animation"></div>

                <h3>
                    We're finding an available professional.
                </h3>

                <p>
                    Your ${escapeHTML(
                        request.service || "service"
                    )}
                    request is being offered to eligible
                    professionals.
                </p>

                <p class="work-meta">
                    Request ID:
                    <strong>
                        ${escapeHTML(request.id)}
                    </strong>
                </p>

                ${
                    status === "worker_cancelled"
                        ? `
                            <p>
                                The previous professional was unavailable.
                                Searching for another professional...
                            </p>
                        `
                        : ""
                }

                <button
                    id="cancelCurrentRequest"
                    class="secondary-button"
                    type="button"
                >
                    Cancel Request
                </button>

            </div>
        `;


        $("cancelCurrentRequest")
            ?.addEventListener(
                "click",
                () => cancelCustomerRequest(
                    request.id
                )
            );


        return;
    }


    if (
        status === "assigned" ||
        status === "accepted" ||
        status === "confirmed" ||
        status === "on_the_way" ||
        status === "in_progress"
    ) {

        const workerPhoto =
            request.workerPhoto ||
            "https://res.cloudinary.com/lqfozcs3/image/upload/v1/fixmywork/default-worker.png";


        activeRequestContainer.innerHTML = `

            <div class="request-card">

                <span class="request-status">
                    ✓ Professional Found
                </span>

                <h3>
                    Your request has been accepted
                </h3>

                <div class="worker-card">

                    <img
                        class="worker-photo"
                        src="${escapeHTML(workerPhoto)}"
                        alt="Professional profile photo"
                    >

                    <div class="worker-info">

                        <h3>
                            ${escapeHTML(
                                request.workerName ||
                                "Professional"
                            )}
                        </h3>

                        <p>
                            🛠️
                            ${escapeHTML(
                                request.service
                            )}
                        </p>

                        ${
                            request.workerRating
                                ? `
                                    <p>
                                        ⭐
                                        ${escapeHTML(
                                            String(
                                                request.workerRating
                                            )
                                        )}
                                    </p>
                                `
                                : ""
                        }

                        ${
                            request.workerPhone
                                ? `
                                    <p>
                                        📞
                                        ${escapeHTML(
                                            request.workerPhone
                                        )}
                                    </p>
                                `
                                : ""
                        }

                    </div>

                    ${
                        request.workerPhone
                            ? `
                                <a
                                    class="call-button"
                                    href="tel:${escapeHTML(
                                        request.workerPhone
                                    )}"
                                >
                                    📞 Call Worker
                                </a>
                            `
                            : ""
                    }

                </div>


                <div class="work-meta">

                    <strong>
                        Service:
                    </strong>

                    ${escapeHTML(
                        request.service
                    )}

                </div>


                <div class="work-meta">

                    <strong>
                        Problem:
                    </strong>

                    ${escapeHTML(
                        request.description
                    )}

                </div>


                <div class="work-meta">

                    <strong>
                        Address:
                    </strong>

                    ${escapeHTML(
                        request.address
                    )}

                </div>


                ${
                    request.photos?.length
                        ? `
                            <div class="request-photos">
                                ${request.photos
                                    .map(
                                        (photo) => `
                                            <img
                                                src="${escapeHTML(
                                                    photo.url
                                                )}"
                                                alt="Request photo"
                                            >
                                        `
                                    )
                                    .join("")}
                            </div>
                        `
                        : ""
                }


                ${
                    status === "on_the_way"
                        ? `
                            <p>
                                🚗 Professional is on the way.
                            </p>
                        `
                        : ""
                }


                ${
                    status === "in_progress"
                        ? `
                            <p>
                                🔧 Work is in progress.
                            </p>
                        `
                        : ""
                }

            </div>
        `;

        return;
    }


    activeRequestContainer.innerHTML = `

        <div class="request-card">

            <span class="request-status">
                ${escapeHTML(
                    getStatusLabel(status)
                )}
            </span>

            <h3>
                Your request is being processed.
            </h3>

        </div>

    `;
}


/* =========================================================
   CANCEL CUSTOMER REQUEST
   ========================================================= */

async function cancelCustomerRequest(
    requestId
) {

    const confirmed =
        window.confirm(
            "Are you sure you want to cancel this request?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await updateDoc(
            doc(
                db,
                "serviceRequests",
                requestId
            ),
            {

                status:
                    "customer_cancelled",

                cancelledBy:
                    "customer",

                cancelledAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            }
        );


        showToast(
            "Request cancelled.",
            "success"
        );


    } catch (error) {

        console.error(
            "Cancel error:",
            error
        );

        showToast(
            "Could not cancel the request.",
            "error"
        );

    }
}


/* =========================================================
   STATUS LABEL
   ========================================================= */

function getStatusLabel(status) {

    const labels = {

        searching:
            "Searching for a Professional",

        pending:
            "Request Received",

        assigned:
            "Professional Assigned",

        accepted:
            "Accepted",

        confirmed:
            "Confirmed",

        on_the_way:
            "Professional On The Way",

        in_progress:
            "Work In Progress",

        completed:
            "Completed",

        worker_cancelled:
            "Professional Cancelled — Searching Again",

        customer_cancelled:
            "Cancelled"

    };

    return labels[status] ||
        "Request Processing";
}


/* =========================================================
   CUSTOMER LISTENERS
   ========================================================= */

function startCustomerListeners(uid) {

    listenForActiveRequests(uid);

    listenForCompletedWorks(uid);
}


function stopCustomerListeners() {

    if (currentRequestUnsubscribe) {

        currentRequestUnsubscribe();

        currentRequestUnsubscribe = null;
    }


    if (worksUnsubscribe) {

        worksUnsubscribe();

        worksUnsubscribe = null;
    }


    activeRequestSection
        ?.classList
        .add("hidden");
}


/* =========================================================
   ACTIVE REQUESTS
   ========================================================= */

function listenForActiveRequests(uid) {

    const q =
        query(
            collection(
                db,
                "serviceRequests"
            ),
            where(
                "customerId",
                "==",
                uid
            )
        );


    const unsubscribe =
        onSnapshot(
            q,
            (snapshot) => {

                let activeRequest = null;


                snapshot.forEach(
                    (document) => {

                        const data =
                            document.data();

                        const activeStatuses = [
                            "searching",
                            "pending",
                            "assigned",
                            "accepted",
                            "confirmed",
                            "on_the_way",
                            "in_progress",
                            "worker_cancelled"
                        ];


                        if (
                            activeStatuses.includes(
                                data.status
                            )
                        ) {

                            const candidate = {

                                id:
                                    document.id,

                                ...data
                            };


                            if (
                                !activeRequest ||
                                getMillis(
                                    candidate.createdAt
                                ) >
                                getMillis(
                                    activeRequest.createdAt
                                )
                            ) {

                                activeRequest =
                                    candidate;

                            }

                        }

                    }
                );


                if (activeRequest) {

                    currentRequestId =
                        activeRequest.id;

                    listenToCurrentRequest(
                        activeRequest.id
                    );

                } else {

                    activeRequestSection
                        ?.classList
                        .add("hidden");

                }

            },
            (error) => {

                console.error(
                    "Active request query error:",
                    error
                );

            }
        );


    if (currentRequestUnsubscribe) {
        currentRequestUnsubscribe();
    }

    currentRequestUnsubscribe =
        unsubscribe;
}


/* =========================================================
   COMPLETED WORKS
   ========================================================= */

function listenForCompletedWorks(uid) {

    if (worksUnsubscribe) {

        worksUnsubscribe();

        worksUnsubscribe = null;
    }


    const q =
        query(
            collection(
                db,
                "serviceRequests"
            ),
            where(
                "customerId",
                "==",
                uid
            ),
            where(
                "status",
                "==",
                "completed"
            )
        );


    worksUnsubscribe =
        onSnapshot(
            q,
            (snapshot) => {

                const works = [];


                snapshot.forEach(
                    (document) => {

                        works.push({

                            id:
                                document.id,

                            ...document.data()

                        });

                    }
                );


                works.sort(
                    (a, b) =>
                        getMillis(b.createdAt) -
                        getMillis(a.createdAt)
                );


                renderCompletedWorks(
                    works
                );

            },
            (error) => {

                console.error(
                    "Completed works error:",
                    error
                );

                showToast(
                    "Unable to load completed works.",
                    "error"
                );

            }
        );
}


/* =========================================================
   COMPLETED WORKS RENDER
   ========================================================= */

function renderCompletedWorks(works) {

    if (!worksContainer) {
        return;
    }


    if (!works.length) {

        worksContainer.innerHTML = `

            <div class="empty-card">

                <div class="empty-icon">
                    📋
                </div>

                <h3>
                    No completed works
                </h3>

                <p>
                    Your completed service works will appear here.
                </p>

            </div>
        `;

        return;
    }


    worksContainer.innerHTML =
        works
            .map(
                (work) => {

                    const hasRating =
                        Number(
                            work.customerRating || 0
                        ) > 0;


                    return `

                        <article
                            class="work-card"
                            data-work-id="${escapeHTML(
                                work.id
                            )}"
                        >

                            <div class="work-top">

                                <div>

                                    <h3>
                                        ${escapeHTML(
                                            work.service
                                        )}
                                    </h3>

                                    <div class="work-meta">
                                        Completed:
                                        ${formatDate(
                                            work.completedAt ||
                                            work.updatedAt
                                        )}
                                    </div>

                                </div>

                                <span class="status-completed">
                                    ✓ Completed
                                </span>

                            </div>


                            <p>
                                ${escapeHTML(
                                    work.description
                                )}
                            </p>


                            <div class="work-meta">

                                📍
                                ${escapeHTML(
                                    work.address
                                )}

                            </div>


                            ${
                                work.workerName
                                    ? `
                                        <div class="worker-card">

                                            <img
                                                class="worker-photo"
                                                src="${escapeHTML(
                                                    work.workerPhoto ||
                                                    ""
                                                )}"
                                                alt="Worker"
                                            >

                                            <div class="worker-info">

                                                <h3>
                                                    ${escapeHTML(
                                                        work.workerName
                                                    )}
                                                </h3>

                                                ${
                                                    work.workerRating
                                                        ? `
                                                            <p>
                                                                ⭐
                                                                ${escapeHTML(
                                                                    String(
                                                                        work.workerRating
                                                                    )
                                                                )}
                                                            </p>
                                                        `
                                                        : ""
                                                }

                                            </div>

                                        </div>
                                    `
                                    : ""
                            }


                            ${
                                Array.isArray(
                                    work.completionPhotos
                                ) &&
                                work.completionPhotos.length
                                    ? `
                                        <div>

                                            <strong>
                                                Work Completion Photos
                                            </strong>

                                            <div class="completion-photos">

                                                ${work.completionPhotos
                                                    .map(
                                                        (photo) => `
                                                            <img
                                                                src="${escapeHTML(
                                                                    photo.url
                                                                )}"
                                                                alt="Completed work"
                                                                loading="lazy"
                                                            >
                                                        `
                                                    )
                                                    .join("")}

                                            </div>

                                        </div>
                                    `
                                    : ""
                            }


                            ${
                                hasRating
                                    ? `
                                        <div class="rating-box">

                                            ⭐ You rated this work
                                            ${escapeHTML(
                                                String(
                                                    work.customerRating
                                                )
                                            )}/5

                                            ${
                                                work.customerFeedback
                                                    ? `
                                                        <p>
                                                            ${escapeHTML(
                                                                work.customerFeedback
                                                            )}
                                                        </p>
                                                    `
                                                    : ""
                                            }

                                        </div>
                                    `
                                    : `
                                        <div class="rating-box">

                                            <strong>
                                                Rate your experience
                                            </strong>

                                            <div
                                                class="rating-buttons"
                                                data-rating-work="${escapeHTML(
                                                    work.id
                                                )}"
                                            >

                                                ${[1,2,3,4,5]
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

                                            <textarea
                                                class="feedback-input"
                                                data-feedback-work="${escapeHTML(
                                                    work.id
                                                )}"
                                                maxlength="1000"
                                                placeholder="Write your feedback..."
                                            ></textarea>

                                            <button
                                                type="button"
                                                class="primary-button save-rating-button"
                                                data-save-rating="${escapeHTML(
                                                    work.id
                                                )}"
                                            >
                                                Submit Feedback
                                            </button>

                                        </div>
                                    `
                            }

                        </article>
                    `;
                }
            )
            .join("");


    bindRatingButtons();
}


/* =========================================================
   RATING
   ========================================================= */

function bindRatingButtons() {

    document
        .querySelectorAll(
            ".rating-buttons"
        )
        .forEach(
            (container) => {

                container
                    .querySelectorAll(
                        ".rating-button"
                    )
                    .forEach(
                        (button) => {

                            button.addEventListener(
                                "click",
                                () => {

                                    container
                                        .querySelectorAll(
                                            ".rating-button"
                                        )
                                        .forEach(
                                            (item) =>
                                                item
                                                    .classList
                                                    .remove(
                                                        "selected"
                                                    )
                                        );

                                    button.classList.add(
                                        "selected"
                                    );

                                    container.dataset.selectedRating =
                                        button.dataset.rating;

                                }
                            );

                        }
                    );

            }
        );


    document
        .querySelectorAll(
            ".save-rating-button"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () =>
                        saveCustomerFeedback(
                            button.dataset.saveRating
                        )
                );

            }
        );
}


/* =========================================================
   SAVE FEEDBACK
   ========================================================= */

async function saveCustomerFeedback(
    workId
) {

    if (!currentUser) {
        return;
    }


    const card =
        document.querySelector(
            `[data-work-id="${CSS.escape(workId)}"]`
        );


    if (!card) {
        return;
    }


    const ratingContainer =
        card.querySelector(
            ".rating-buttons"
        );


    const rating =
        Number(
            ratingContainer?.dataset.selectedRating
        );


    const feedback =
        card
            .querySelector(
                `[data-feedback-work="${CSS.escape(
                    workId
                )}"]`
            )
            ?.value
            .trim() || "";


    if (
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
    ) {

        showToast(
            "Please select a rating from 1 to 5.",
            "error"
        );

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

                customerFeedback:
                    feedback,

                customerRatedAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            }
        );


        showToast(
            "Thank you for your feedback.",
            "success"
        );


    } catch (error) {

        console.error(
            "Feedback error:",
            error
        );

        showToast(
            "Could not save feedback.",
            "error"
        );

    }
}


/* =========================================================
   LOCATION
   ========================================================= */

$("locationButton")?.addEventListener(
    "click",
    requestLocation
);


$("useLocationButton")?.addEventListener(
    "click",
    requestLocation
);


$("bookingLocationButton")?.addEventListener(
    "click",
    requestLocation
);


function requestLocation() {

    if (!navigator.geolocation) {

        showToast(
            "Location is not supported on this device.",
            "error"
        );

        return;
    }


    $("mapStatus").textContent =
        "Getting your location...";


    navigator.geolocation.getCurrentPosition(

        async (position) => {

            currentLocation.latitude =
                position.coords.latitude;

            currentLocation.longitude =
                position.coords.longitude;


            await reverseGeocode(
                currentLocation.latitude,
                currentLocation.longitude
            );


            $("mapStatus").textContent =
                "Location detected";


            const bookingStatus =
                $("bookingLocationStatus");

            if (bookingStatus) {

                bookingStatus.textContent =
                    "✓ Current location selected";

            }


            const address =
                $("serviceAddress");

            if (
                address &&
                currentLocation.address
            ) {

                address.value =
                    currentLocation.address;

            }


            showToast(
                "Location detected successfully.",
                "success"
            );


            updateMapMarker();

        },

        (error) => {

            console.error(
                "Location error:",
                error
            );

            $("mapStatus").textContent =
                "Location permission required";


            showToast(
                "Please allow location permission.",
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


/* =========================================================
   REVERSE GEOCODING
   ========================================================= */

async function reverseGeocode(
    latitude,
    longitude
) {

    try {

        const response =
            await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
                    latitude
                )}&lon=${encodeURIComponent(
                    longitude
                )}`,
                {
                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );


        if (!response.ok) {
            return;
        }


        const result =
            await response.json();


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
   MAP
   ========================================================= */

let map = null;

let customerMarker = null;


async function initializeMap() {

    const mapElement =
        $("map");


    if (!mapElement) {
        return;
    }


    try {

        await loadLeaflet();


        map =
            window.L
                .map(
                    mapElement
                )
                .setView(
                    [16.3067, 80.4365],
                    13
                );


        window.L
            .tileLayer(
                "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                {
                    maxZoom: 19,
                    attribution:
                        "&copy; OpenStreetMap contributors"
                }
            )
            .addTo(map);


    } catch (error) {

        console.error(
            "Map error:",
            error
        );

    }
}


function loadLeaflet() {

    return new Promise(
        (resolve, reject) => {

            if (window.L) {

                resolve();

                return;
            }


            const existing =
                document.querySelector(
                    'script[data-leaflet="true"]'
                );


            if (existing) {

                existing.addEventListener(
                    "load",
                    () => resolve()
                );

                existing.addEventListener(
                    "error",
                    reject
                );

                return;
            }


            const css =
                document.createElement(
                    "link"
                );

            css.rel =
                "stylesheet";

            css.href =
                "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

            document.head.appendChild(
                css
            );


            const script =
                document.createElement(
                    "script"
                );

            script.src =
                "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

            script.dataset.leaflet =
                "true";

            script.onload =
                () => resolve();

            script.onerror =
                reject;

            document.head.appendChild(
                script
            );

        }
    );
}


function updateMapMarker() {

    if (
        !map ||
        !window.L ||
        currentLocation.latitude === null
    ) {
        return;
    }


    if (customerMarker) {
        customerMarker.remove();
    }


    customerMarker =
        window.L
            .marker(
                [
                    currentLocation.latitude,
                    currentLocation.longitude
                ]
            )
            .addTo(map)
            .bindPopup(
                "Your service location"
            );


    map.setView(
        [
            currentLocation.latitude,
            currentLocation.longitude
        ],
        15
    );

}


/* =========================================================
   POLICY
   ========================================================= */

const POLICIES = {

    terms: {

        title:
            "Terms & Conditions",

        content: `
            <p>
                FIX MY WORK is a service discovery and coordination
                platform connecting customers with independent service
                professionals.
            </p>

            <p>
                Customers must provide accurate contact, service and
                location information when creating a request.
            </p>

            <p>
                Professionals are responsible for accepting only jobs
                they are willing and able to perform.
            </p>

            <p>
                Service pricing, completion and payment arrangements
                must be clearly communicated between the customer and
                professional.
            </p>

            <p>
                FIX MY WORK may suspend accounts involved in misuse,
                fraud, harassment or unsafe activity.
            </p>
        `
    },


    privacy: {

        title:
            "Privacy Policy",

        content: `
            <p>
                FIX MY WORK may collect account information, mobile
                number, service request details, location information,
                profile photos and service-related photos necessary
                to operate the platform.
            </p>

            <p>
                Customer information is used to provide requested
                services, connect customers with eligible professionals,
                maintain service history and provide support.
            </p>

            <p>
                We do not ask customers to share passwords, OTPs or
                banking credentials with professionals.
            </p>

            <p>
                Users may contact FIX MY WORK for account or privacy
                related questions at fixmywork6734@gmail.com.
            </p>
        `
    },


    safety: {

        title:
            "Safety",

        content: `
            <h3>Stay Safe</h3>

            <p>
                Never share your OTP, password, card PIN, UPI PIN or
                banking credentials with a service professional.
            </p>

            <p>
                Confirm the service details and expected work before
                allowing work to begin.
            </p>

            <p>
                If you feel unsafe, stop the interaction and contact
                FIX MY WORK support.
            </p>

            <p>
                Support:
                <strong>
                    fixmywork6734@gmail.com
                </strong>
            </p>
        `
    }

};


document
    .querySelectorAll(
        "[data-policy]"
    )
    .forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const policy =
                        POLICIES[
                            button.dataset.policy
                        ];


                    if (!policy) {
                        return;
                    }


                    $("policyTitle").textContent =
                        policy.title;


                    $("policyContent").innerHTML =
                        policy.content;


                    openModal(
                        policyModal
                    );

                }
            );

        }
    );


/* =========================================================
   SAFETY CLOSE
   ========================================================= */

$("closeSafety")?.addEventListener(
    "click",
    () => {

        $("safetyBanner")
            ?.remove();

    }
);


/* =========================================================
   MOBILE MENU
   ========================================================= */

$("menuButton")?.addEventListener(
    "click",
    () => {

        const nav =
            $("desktopNav");


        if (!nav) {
            return;
        }


        if (
            nav.style.display === "flex"
        ) {

            nav.style.display =
                "";

        } else {

            nav.style.display =
                "flex";

            nav.style.position =
                "absolute";

            nav.style.top =
                "78px";

            nav.style.left =
                "0";

            nav.style.right =
                "0";

            nav.style.padding =
                "20px";

            nav.style.background =
                "white";

            nav.style.flexDirection =
                "column";

        }

    }
);


/* =========================================================
   HELPERS
   ========================================================= */

function getMillis(timestamp) {

    if (!timestamp) {
        return 0;
    }

    try {

        return timestamp.toMillis
            ? timestamp.toMillis()
            : new Date(timestamp).getTime();

    } catch {

        return 0;
    }
}


/* =========================================================
   YEAR
   ========================================================= */

if ($("year")) {

    $("year").textContent =
        new Date().getFullYear();

}


/* =========================================================
   INITIALIZE
   ========================================================= */

buildServices();

initializeMap();

updateAuthUI();

console.log(
    "FIX MY WORK Customer App initialized."
);
