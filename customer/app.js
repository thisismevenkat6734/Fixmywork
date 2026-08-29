// ============================================================
// FIX MY WORK — CUSTOMER APP
// customer/app.js
// ============================================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile
} from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    arrayUnion
} from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================
//
// IMPORTANT:
// Replace ONLY these values with your Firebase project values.
// ============================================================

const firebaseConfig = {

    apiKey: "YOUR_API_KEY",

    authDomain:
        "YOUR_PROJECT.firebaseapp.com",

    projectId:
        "YOUR_PROJECT_ID",

    storageBucket:
        "YOUR_PROJECT.firebasestorage.app",

    messagingSenderId:
        "YOUR_MESSAGING_SENDER_ID",

    appId:
        "YOUR_APP_ID"

};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

const storage = getStorage(app);


// ============================================================
// GLOBAL STATE
// ============================================================

let currentUser = null;

let currentCustomer = null;

let selectedService = "";

let selectedRating = 0;

let currentRequestId = null;

let currentWorker = null;

let deferredInstallPrompt = null;

let unsubscribeCustomerRequests = null;


// ============================================================
// DOM HELPERS
// ============================================================

const $ = (id) => document.getElementById(id);

const $$ = (selector) =>
    document.querySelectorAll(selector);


// ============================================================
// YEAR
// ============================================================

if ($("currentYear")) {

    $("currentYear").textContent =
        new Date().getFullYear();

}


// ============================================================
// TOAST
// ============================================================

function showToast(message, type = "info") {

    const container =
        $("toastContainer");

    if (!container) return;

    const toast =
        document.createElement("div");

    toast.className =
        `toast toast-${type}`;

    toast.textContent =
        message;

    container.appendChild(toast);

    setTimeout(() => {

        toast.classList.add("show");

    }, 10);

    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 3500);
}


// ============================================================
// MODAL
// ============================================================

function openModal(id) {

    const modal = $(id);

    if (!modal) return;

    modal.classList.remove("hidden");

    document.body.classList.add("modal-open");
}


function closeModal(id) {

    const modal = $(id);

    if (!modal) return;

    modal.classList.add("hidden");

    const anyOpen =
        document.querySelector(".modal:not(.hidden)");

    if (!anyOpen) {

        document.body.classList.remove("modal-open");

    }
}


$$("[data-close-modal]").forEach(button => {

    button.addEventListener("click", () => {

        closeModal(
            button.dataset.closeModal
        );

    });

});


$$(".modal").forEach(modal => {

    modal.addEventListener("click", event => {

        if (event.target === modal) {

            closeModal(modal.id);

        }

    });

});


// ============================================================
// AUTH MODE
// ============================================================

let authMode = "login";


// ============================================================
// AUTH BUTTON
// ============================================================

$("authButton")?.addEventListener("click", () => {

    if (currentUser) {

        loadCustomerProfileIntoForm();

        openModal("profileModal");

    } else {

        authMode = "login";

        updateAuthModal();

        openModal("authModal");

    }

});


// ============================================================
// UPDATE AUTH MODAL
// ============================================================

function updateAuthModal() {

    if (authMode === "register") {

        $("authTitle").textContent =
            "Create your account";

        $("authDescription").textContent =
            "Create a customer account using your email and password.";

        $("authForm")
            .querySelector("button[type='submit']")
            .textContent =
            "Create Account";

        $("createAccountButton").textContent =
            "Already have an account? Login";

    } else {

        $("authTitle").textContent =
            "Login to FIX MY WORK";

        $("authDescription").textContent =
            "Login with your email address and password.";

        $("authForm")
            .querySelector("button[type='submit']")
            .textContent =
            "Login";

        $("createAccountButton").textContent =
            "Create new account";

    }

}


// ============================================================
// SWITCH LOGIN / REGISTER
// ============================================================

$("createAccountButton")?.addEventListener(
    "click",
    () => {

        authMode =
            authMode === "login"
                ? "register"
                : "login";

        updateAuthModal();

    }
);


// ============================================================
// AUTH FORM
// ============================================================

$("authForm")?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        const email =
            $("authEmail").value.trim();

        const password =
            $("authPassword").value;

        if (!email || !password) {

            showToast(
                "Please enter email and password.",
                "error"
            );

            return;

        }

        try {

            if (authMode === "register") {

                const result =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );

                await setDoc(
                    doc(
                        db,
                        "customers",
                        result.user.uid
                    ),
                    {

                        uid:
                            result.user.uid,

                        email:
                            email,

                        name:
                            "",

                        phone:
                            "",

                        photoURL:
                            "",

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()

                    },
                    { merge: true }
                );

                showToast(
                    "Account created successfully.",
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

            $("authForm").reset();

            closeModal("authModal");

        } catch (error) {

            console.error(error);

            showToast(
                getFirebaseErrorMessage(error),
                "error"
            );

        }

    }
);


// ============================================================
// FIREBASE ERROR MESSAGE
// ============================================================

function getFirebaseErrorMessage(error) {

    const code =
        error?.code || "";

    switch (code) {

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/email-already-in-use":
            return "This email is already registered.";

        case "auth/weak-password":
            return "Password must be at least 6 characters.";

        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/user-not-found":
            return "Account not found.";

        case "auth/wrong-password":
            return "Incorrect password.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        default:
            return error?.message ||
                "Something went wrong. Please try again.";

    }

}


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    async user => {

        currentUser = user;

        if (user) {

            await loadCustomer();

            updateLoggedInUI();

            subscribeToCustomerRequests();

        } else {

            currentCustomer = null;

            updateLoggedOutUI();

            if (unsubscribeCustomerRequests) {

                unsubscribeCustomerRequests();

                unsubscribeCustomerRequests = null;

            }

        }

    }
);


// ============================================================
// LOAD CUSTOMER
// ============================================================

async function loadCustomer() {

    if (!currentUser) return;

    try {

        const customerRef =
            doc(
                db,
                "customers",
                currentUser.uid
            );

        const snapshot =
            await getDoc(customerRef);

        if (snapshot.exists()) {

            currentCustomer =
                snapshot.data();

        } else {

            currentCustomer = {

                uid:
                    currentUser.uid,

                email:
                    currentUser.email || "",

                name:
                    currentUser.displayName || "",

                phone:
                    "",

                photoURL:
                    ""

            };

            await setDoc(
                customerRef,
                {
                    ...currentCustomer,
                    createdAt:
                        serverTimestamp(),
                    updatedAt:
                        serverTimestamp()
                },
                { merge: true }
            );

        }

    } catch (error) {

        console.error(
            "Customer loading error:",
            error
        );

        showToast(
            "Unable to load your account.",
            "error"
        );

    }

}


// ============================================================
// LOGGED-IN UI
// ============================================================

function updateLoggedInUI() {

    const button =
        $("authButton");

    if (!button) return;

    button.textContent =
        "My Account";

}


// ============================================================
// LOGGED-OUT UI
// ============================================================

function updateLoggedOutUI() {

    const button =
        $("authButton");

    if (!button) return;

    button.textContent =
        "Login";

}


// ============================================================
// PROFILE
// ============================================================

function loadCustomerProfileIntoForm() {

    if (!currentUser) return;

    const customer =
        currentCustomer || {};

    $("profileName").value =
        customer.name ||
        currentUser.displayName ||
        "";

    $("profilePhone").value =
        customer.phone || "";

    $("profileEmail").value =
        currentUser.email || "";

    const image =
        $("customerProfilePreview");

    const placeholder =
        $("profilePhotoPlaceholder");

    if (customer.photoURL) {

        image.src =
            customer.photoURL;

        image.classList.remove("hidden");

        placeholder.classList.add("hidden");

    } else {

        image.classList.add("hidden");

        placeholder.classList.remove("hidden");

    }

}


// ============================================================
// PROFILE PHOTO PREVIEW
// ============================================================

$("profilePhoto")?.addEventListener(
    "change",
    event => {

        const file =
            event.target.files?.[0];

        if (!file) return;

        const url =
            URL.createObjectURL(file);

        $("customerProfilePreview").src =
            url;

        $("customerProfilePreview")
            .classList.remove("hidden");

        $("profilePhotoPlaceholder")
            .classList.add("hidden");

    }
);


// ============================================================
// SAVE PROFILE
// ============================================================

$("profileForm")?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        if (!currentUser) {

            showToast(
                "Please login first.",
                "error"
            );

            return;

        }

        const name =
            $("profileName")
                .value
                .trim();

        const phone =
            $("profilePhone")
                .value
                .trim();

        const photoFile =
            $("profilePhoto")
                .files?.[0];

        if (!name || !phone) {

            showToast(
                "Please complete your profile.",
                "error"
            );

            return;

        }

        try {

            let photoURL =
                currentCustomer?.photoURL || "";

            if (photoFile) {

                validateImage(photoFile);

                const photoRef =
                    ref(
                        storage,
                        `customers/${currentUser.uid}/profile/${Date.now()}_${photoFile.name}`
                    );

                await uploadBytes(
                    photoRef,
                    photoFile
                );

                photoURL =
                    await getDownloadURL(photoRef);

            }


            await updateProfile(
                currentUser,
                {
                    displayName:
                        name,

                    photoURL:
                        photoURL || null
                }
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

                    email:
                        currentUser.email || "",

                    name:
                        name,

                    phone:
                        phone,

                    photoURL:
                        photoURL,

                    updatedAt:
                        serverTimestamp()

                },
                { merge: true }
            );


            currentCustomer = {

                ...(currentCustomer || {}),

                name,
                phone,
                photoURL

            };


            showToast(
                "Profile updated.",
                "success"
            );

            closeModal("profileModal");

        } catch (error) {

            console.error(error);

            showToast(
                getFirebaseErrorMessage(error),
                "error"
            );

        }

    }
);


// ============================================================
// LOGOUT
// ============================================================

$("logoutButton")?.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            closeModal("profileModal");

            showToast(
                "Logged out successfully.",
                "success"
            );

        } catch (error) {

            console.error(error);

            showToast(
                "Unable to logout.",
                "error"
            );

        }

    }
);


// ============================================================
// SERVICE CARDS
// ============================================================

$$(".service-card").forEach(card => {

    card.addEventListener(
        "click",
        () => {

            const service =
                card.dataset.service;

            openServiceRequest(service);

        }
    );

});


// ============================================================
// REQUEST SERVICE BUTTON
// ============================================================

$("requestServiceButton")?.addEventListener(
    "click",
    () => {

        openServiceRequest("");

    }
);


$("emptyRequestButton")?.addEventListener(
    "click",
    () => {

        openServiceRequest("");

    }
);


// ============================================================
// OPEN SERVICE REQUEST
// ============================================================

function openServiceRequest(service = "") {

    if (!currentUser) {

        authMode = "login";

        updateAuthModal();

        openModal("authModal");

        showToast(
            "Please login before booking a service.",
            "info"
        );

        return;

    }


    selectedService =
        service || "";

    $("serviceSelect").value =
        service || "";

    $("servicePhone").value =
        currentCustomer?.phone || "";


    if (service) {

        $("selectedServiceText").textContent =
            `${service} selected. Tell us what needs to be fixed.`;

    } else {

        $("selectedServiceText").textContent =
            "Select the service you need.";

    }


    openModal("serviceModal");

}


// ============================================================
// VIEW ALL SERVICES
// ============================================================

$("viewAllServices")?.addEventListener(
    "click",
    () => {

        document
            .getElementById("services")
            ?.scrollIntoView({
                behavior: "smooth"
            });

    }
);


// ============================================================
// SERVICE SELECT
// ============================================================

$("serviceSelect")?.addEventListener(
    "change",
    event => {

        selectedService =
            event.target.value;

        if (selectedService) {

            $("selectedServiceText")
                .textContent =
                `${selectedService} selected.`;

        }

    }
);


// ============================================================
// LOCATION STATE
// ============================================================

let customerLocation = {

    latitude: null,

    longitude: null

};


// ============================================================
// GET LOCATION
// ============================================================

function getCustomerLocation() {

    return new Promise(
        (resolve, reject) => {

            if (!navigator.geolocation) {

                reject(
                    new Error(
                        "Geolocation is not supported."
                    )
                );

                return;

            }

            navigator.geolocation.getCurrentPosition(

                position => {

                    customerLocation = {

                        latitude:
                            position.coords.latitude,

                        longitude:
                            position.coords.longitude

                    };

                    resolve(
                        customerLocation
                    );

                },

                error => {

                    reject(error);

                },

                {

                    enableHighAccuracy:
                        true,

                    timeout:
                        15000,

                    maximumAge:
                        60000

                }

            );

        }
    );

}


// ============================================================
// LOCATION BUTTONS
// ============================================================

$("locationButton")?.addEventListener(
    "click",
    useCurrentLocation
);


$("useLocationButton")?.addEventListener(
    "click",
    useCurrentLocation
);


$("useLocationInRequest")?.addEventListener(
    "click",
    async () => {

        try {

            await useCurrentLocation();

        } catch {

            // handled inside function

        }

    }
);


// ============================================================
// USE CURRENT LOCATION
// ============================================================

async function useCurrentLocation() {

    try {

        showToast(
            "Getting your location...",
            "info"
        );

        const location =
            await getCustomerLocation();


        $("locationText").textContent =
            "Location Ready";

        $("mapStatus").textContent =
            "Your location is ready";

        $("nearbyCount").textContent =
            "Ready for nearby matching";


        if ($("serviceAddress").value.trim() === "") {

            $("serviceAddress").value =
                `Location coordinates: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;

        }


        showToast(
            "Location detected successfully.",
            "success"
        );


        return location;

    } catch (error) {

        console.error(error);

        showToast(
            "Location permission is required for nearby matching.",
            "error"
        );

        throw error;

    }

}


// ============================================================
// SERVICE PHOTO PREVIEW
// ============================================================

$("servicePhoto")?.addEventListener(
    "change",
    event => {

        previewFiles(
            event.target.files,
            $("photoPreview")
        );

    }
);


$("completionPhoto")?.addEventListener(
    "change",
    event => {

        previewFiles(
            event.target.files,
            $("completionPhotoPreview")
        );

    }
);


// ============================================================
// PREVIEW FILES
// ============================================================

function previewFiles(files, container) {

    if (!container) return;

    container.innerHTML = "";

    [...files].forEach(file => {

        try {

            validateImage(file);

            const image =
                document.createElement("img");

            image.src =
                URL.createObjectURL(file);

            image.alt =
                "Selected photo";

            container.appendChild(image);

        } catch (error) {

            showToast(
                error.message,
                "error"
            );

        }

    });

}


// ============================================================
// IMAGE VALIDATION
// ============================================================

function validateImage(file) {

    const allowed =
        [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

    if (!allowed.includes(file.type)) {

        throw new Error(
            "Only JPG, PNG or WEBP images are allowed."
        );

    }

    const maxSize =
        8 * 1024 * 1024;

    if (file.size > maxSize) {

        throw new Error(
            "Each image must be smaller than 8 MB."
        );

    }

}


// ============================================================
// CREATE SERVICE REQUEST
// ============================================================

$("serviceForm")?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        if (!currentUser) {

            showToast(
                "Please login first.",
                "error"
            );

            return;

        }


        const service =
            $("serviceSelect")
                .value
                .trim();

        const phone =
            $("servicePhone")
                .value
                .trim();

        const description =
            $("problemDescription")
                .value
                .trim();

        const address =
            $("serviceAddress")
                .value
                .trim();

        const photoFiles =
            [...(
                $("servicePhoto")
                    .files || []
            )];


        if (!service) {

            showToast(
                "Please select a service.",
                "error"
            );

            return;

        }

        if (!phone) {

            showToast(
                "Please enter your mobile number.",
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


        if (
            !customerLocation.latitude ||
            !customerLocation.longitude
        ) {

            try {

                await getCustomerLocation();

            } catch {

                showToast(
                    "Please enable location so we can find nearby professionals.",
                    "error"
                );

                return;

            }

        }


        try {

            const submitButton =
                $("submitServiceButton");

            submitButton.disabled =
                true;

            submitButton.textContent =
                "Creating Request...";


            // =================================================
            // UPLOAD CUSTOMER REQUEST PHOTOS
            // =================================================

            const photoURLs = [];

            for (
                const file
                of photoFiles
            ) {

                validateImage(file);

                const photoRef =
                    ref(
                        storage,
                        `serviceRequests/${currentUser.uid}/${Date.now()}_${file.name}`
                    );

                await uploadBytes(
                    photoRef,
                    file
                );

                const url =
                    await getDownloadURL(
                        photoRef
                    );

                photoURLs.push(url);

            }


            // =================================================
            // REQUEST DATA
            // =================================================

            const requestData = {

                customerId:
                    currentUser.uid,

                customerName:
                    currentCustomer?.name ||
                    currentUser.displayName ||
                    "",

                customerEmail:
                    currentUser.email ||
                    "",

                customerPhone:
                    phone,

                customerPhotoURL:
                    currentCustomer?.photoURL ||
                    "",


                service:
                    service,

                description:
                    description,

                address:
                    address,


                location: {

                    latitude:
                        customerLocation.latitude,

                    longitude:
                        customerLocation.longitude

                },


                photos:
                    photoURLs,


                status:
                    "searching",


                acceptedWorkerId:
                    null,

                acceptedWorkerName:
                    null,

                acceptedWorkerPhone:
                    null,

                acceptedWorkerPhotoURL:
                    null,

                acceptedAt:
                    null,


                cancelledBy:
                    null,

                cancellationReason:
                    null,


                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            };


            // =================================================
            // CREATE REQUEST
            // =================================================

            const requestRef =
                await addDoc(
                    collection(
                        db,
                        "serviceRequests"
                    ),
                    requestData
                );


            currentRequestId =
                requestRef.id;


            $("serviceForm").reset();

            $("photoPreview").innerHTML =
                "";

            closeModal("serviceModal");


            // =================================================
            // SHOW SEARCHING
            // =================================================

            showSearchingScreen(
                requestRef.id,
                service
            );


            // =================================================
            // WATCH REQUEST
            // =================================================

            listenToCurrentRequest(
                requestRef.id
            );


            showToast(
                "Service request created.",
                "success"
            );


        } catch (error) {

            console.error(
                "Request creation error:",
                error
            );

            showToast(
                "Unable to create the service request.",
                "error"
            );

        } finally {

            const submitButton =
                $("submitServiceButton");

            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    "Find a Professional";

            }

        }

    }
);


// ============================================================
// SHOW SEARCHING SCREEN
// ============================================================

function showSearchingScreen(
    requestId,
    service
) {

    currentRequestId =
        requestId;

    $("searchingService")
        .textContent =
        service;

    $("searchingStatus")
        .textContent =
        "Searching for available professionals...";

    openModal(
        "searchingModal"
    );

}


// ============================================================
// LISTEN TO CURRENT REQUEST
// ============================================================

let unsubscribeCurrentRequest = null;


function listenToCurrentRequest(requestId) {

    if (unsubscribeCurrentRequest) {

        unsubscribeCurrentRequest();

    }


    const requestRef =
        doc(
            db,
            "serviceRequests",
            requestId
        );


    unsubscribeCurrentRequest =
        onSnapshot(
            requestRef,
            snapshot => {

                if (!snapshot.exists()) {

                    return;

                }


                const request =
                    snapshot.data();


                handleRequestStatus(
                    requestId,
                    request
                );

            },

            error => {

                console.error(
                    "Request listener error:",
                    error
                );

            }
        );

}


// ============================================================
// HANDLE REQUEST STATUS
// ============================================================

function handleRequestStatus(
    requestId,
    request
) {

    currentRequestId =
        requestId;


    if (request.status === "searching") {

        $("searchingStatus")
            .textContent =
            "Searching for available professionals...";

        return;

    }


    if (request.status === "accepted") {

        closeModal(
            "searchingModal"
        );

        showWorkerDetails(
            request
        );

        return;

    }


    if (
        request.status === "cancelled"
    ) {

        closeModal(
            "searchingModal"
        );

        showToast(
            "This service request was cancelled.",
            "info"
        );

        return;

    }


    if (
        request.status === "completed"
    ) {

        closeModal(
            "searchingModal"
        );

        showFeedbackModal(
            requestId
        );

        return;

    }

}


// ============================================================
// CANCEL SEARCHING
// ============================================================

$("cancelSearchingButton")?.addEventListener(
    "click",
    async () => {

        if (!currentRequestId) {

            closeModal(
                "searchingModal"
            );

            return;

        }


        const confirmed =
            confirm(
                "Cancel this service request?"
            );

        if (!confirmed) return;


        try {

            await updateDoc(
                doc(
                    db,
                    "serviceRequests",
                    currentRequestId
                ),
                {

                    status:
                        "cancelled",

                    cancelledBy:
                        "customer",

                    cancellationReason:
                        "Customer cancelled while searching.",

                    updatedAt:
                        serverTimestamp()

                }
            );


            closeModal(
                "searchingModal"
            );


            showToast(
                "Service request cancelled.",
                "success"
            );


        } catch (error) {

            console.error(error);

            showToast(
                "Unable to cancel request.",
                "error"
            );

        }

    }
);


// ============================================================
// SHOW WORKER DETAILS
// ============================================================

function showWorkerDetails(request) {

    currentWorker = {

        id:
            request.acceptedWorkerId,

        name:
            request.acceptedWorkerName,

        phone:
            request.acceptedWorkerPhone,

        photoURL:
            request.acceptedWorkerPhotoURL,

        service:
            request.service,

        rating:
            request.acceptedWorkerRating,

        experience:
            request.acceptedWorkerExperience

    };


    $("workerName")
        .textContent =
        currentWorker.name ||
        "Professional";


    $("workerService")
        .textContent =
        currentWorker.service ||
        request.service ||
        "Service";


    $("workerPhone")
        .textContent =
        currentWorker.phone
            ? `📞 ${currentWorker.phone}`
            : "Mobile number available";


    $("workerRating")
        .textContent =
        currentWorker.rating
            ? `⭐ ${currentWorker.rating}`
            : "⭐ Rating available";


    $("workerExperience")
        .textContent =
        currentWorker.experience
            ? `Experience: ${currentWorker.experience}`
            : "Verified professional";


    $("workerStatus")
        .textContent =
        "✓ Professional accepted your request.";


    const photo =
        $("workerProfilePhoto");

    const placeholder =
        $("workerPhotoPlaceholder");


    if (currentWorker.photoURL) {

        photo.src =
            currentWorker.photoURL;

        photo.classList.remove(
            "hidden"
        );

        placeholder.classList.add(
            "hidden"
        );

    } else {

        photo.classList.add(
            "hidden"
        );

        placeholder.classList.remove(
            "hidden"
        );

    }


    const callButton =
        $("callWorkerButton");


    if (currentWorker.phone) {

        callButton.href =
            `tel:${currentWorker.phone}`;

        callButton.classList.remove(
            "disabled"
        );

    } else {

        callButton.href =
            "#";

        callButton.classList.add(
            "disabled"
        );

    }


    openModal(
        "workerDetailsModal"
    );

}


// ============================================================
// CUSTOMER CANCEL AFTER ACCEPT
// ============================================================

$("workerCancelButton")?.addEventListener(
    "click",
    async () => {

        if (!currentRequestId) return;


        const confirmed =
            confirm(
                "Do you want to cancel this accepted work?"
            );

        if (!confirmed) return;


        try {

            await updateDoc(
                doc(
                    db,
                    "serviceRequests",
                    currentRequestId
                ),
                {

                    status:
                        "cancelled",

                    cancelledBy:
                        "customer",

                    cancellationReason:
                        "Customer cancelled after acceptance.",

                    updatedAt:
                        serverTimestamp()

                }
            );


            closeModal(
                "workerDetailsModal"
            );


            showToast(
                "Work cancelled.",
                "success"
            );


        } catch (error) {

            console.error(error);

            showToast(
                "Unable to cancel the work.",
                "error"
            );

        }

    }
);


// ============================================================
// CUSTOMER REQUEST HISTORY
// ============================================================

function subscribeToCustomerRequests() {

    if (!currentUser) return;


    if (unsubscribeCustomerRequests) {

        unsubscribeCustomerRequests();

    }


    const requestsQuery =
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
            )
        );


    unsubscribeCustomerRequests =
        onSnapshot(
            requestsQuery,
            snapshot => {

                const requests =
                    snapshot.docs.map(
                        document => ({

                            id:
                                document.id,

                            ...document.data()

                        })
                    );


                renderCustomerWorks(
                    requests
                );

            },

            error => {

                console.error(
                    "History error:",
                    error
                );

            }
        );

}


// ============================================================
// RENDER CUSTOMER WORKS
// ============================================================

function renderCustomerWorks(
    requests
) {

    const container =
        $("worksContainer");

    if (!container) return;


    const completed =
        requests.filter(
            request =>
                request.status === "completed"
        );


    if (completed.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    📋
                </div>

                <h3>
                    No completed works
                </h3>

                <p>
                    Your completed service works will appear here.
                </p>

                <button
                    class="primary-button"
                    id="historyRequestButton"
                    type="button"
                >
                    Request a Service
                </button>

            </div>

        `;


        $("historyRequestButton")
            ?.addEventListener(
                "click",
                () => openServiceRequest("")
            );


        return;

    }


    container.innerHTML = "";


    completed.forEach(
        request => {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "work-card";


            const date =
                formatTimestamp(
                    request.completedAt ||
                    request.updatedAt ||
                    request.createdAt
                );


            card.innerHTML = `

                <div class="work-card-top">

                    <div>

                        <span class="work-service">
                            ${escapeHTML(
                                request.service || "Service"
                            )}
                        </span>

                        <small>
                            ${escapeHTML(date)}
                        </small>

                    </div>

                    <span class="status-badge completed">
                        Completed
                    </span>

                </div>


                <p>
                    ${escapeHTML(
                        request.description || ""
                    )}
                </p>


                <div class="work-worker">

                    <strong>
                        Professional
                    </strong>

                    <span>
                        ${escapeHTML(
                            request.acceptedWorkerName ||
                            "Professional"
                        )}
                    </span>

                </div>


                <button
                    class="secondary-button review-button"
                    data-work-id="${request.id}"
                    type="button"
                >
                    ⭐ Rate & Review
                </button>

            `;


            container.appendChild(
                card
            );

        }
    );


    $$(".review-button").forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showFeedbackModal(
                        button.dataset.workId
                    );

                }
            );

        }
    );

}


// ============================================================
// FEEDBACK MODAL
// ============================================================

function showFeedbackModal(
    workId
) {

    $("feedbackWorkId")
        .value =
        workId;

    $("selectedRating")
        .value =
        "";

    $("feedbackText")
        .value =
        "";

    selectedRating =
        0;


    $$("#ratingButtons button")
        .forEach(button => {

            button.classList.remove(
                "selected"
            );

        });


    openModal(
        "feedbackModal"
    );

}


// ============================================================
// RATING
// ============================================================

$$("#ratingButtons button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                selectedRating =
                    Number(
                        button.dataset.rating
                    );

                $("selectedRating")
                    .value =
                    selectedRating;


                $$("#ratingButtons button")
                    .forEach(
                        ratingButton => {

                            ratingButton.classList.toggle(
                                "selected",
                                Number(
                                    ratingButton.dataset.rating
                                ) <= selectedRating
                            );

                        }
                    );

            }
        );

    });


// ============================================================
// FEEDBACK FORM
// ============================================================

$("feedbackForm")?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!currentUser) {

            showToast(
                "Please login first.",
                "error"
            );

            return;

        }


        const workId =
            $("feedbackWorkId")
                .value;

        const rating =
            Number(
                $("selectedRating")
                    .value
            );

        const feedback =
            $("feedbackText")
                .value
                .trim();

        const files =
            [...(
                $("completionPhoto")
                    .files || []
            )];


        if (!rating) {

            showToast(
                "Please select a rating.",
                "error"
            );

            return;

        }


        if (!feedback) {

            showToast(
                "Please enter your feedback.",
                "error"
            );

            return;

        }


        try {

            const photoURLs = [];


            for (
                const file
                of files
            ) {

                validateImage(file);

                const photoRef =
                    ref(
                        storage,
                        `feedback/${currentUser.uid}/${workId}/${Date.now()}_${file.name}`
                    );


                await uploadBytes(
                    photoRef,
                    file
                );


                const url =
                    await getDownloadURL(
                        photoRef
                    );


                photoURLs.push(url);

            }


            const reviewData = {

                customerId:
                    currentUser.uid,

                workId:
                    workId,

                rating:
                    rating,

                feedback:
                    feedback,

                photos:
                    photoURLs,

                createdAt:
                    serverTimestamp()

            };


            await addDoc(
                collection(
                    db,
                    "reviews"
                ),
                reviewData
            );


            await updateDoc(
                doc(
                    db,
                    "serviceRequests",
                    workId
                ),
                {

                    customerReviewed:
                        true,

                    customerRating:
                        rating,

                    customerFeedback:
                        feedback,

                    reviewPhotos:
                        photoURLs,

                    updatedAt:
                        serverTimestamp()

                }
            );


            closeModal(
                "feedbackModal"
            );


            $("feedbackForm")
                .reset();


            $("completionPhotoPreview")
                .innerHTML =
                "";


            showToast(
                "Thank you for your review.",
                "success"
            );


        } catch (error) {

            console.error(error);

            showToast(
                "Unable to submit your review.",
                "error"
            );

        }

    }
);


// ============================================================
// SUPPORT
// ============================================================

$("supportButton")?.addEventListener(
    "click",
    () => {

        window.location.href =
            "mailto:fixmywork6734@gmail.com?subject=FIX MY WORK Support";

    }
);


// ============================================================
// TERMS
// ============================================================

$("termsButton")?.addEventListener(
    "click",
    () => {

        openModal(
            "termsModal"
        );

    }
);


// ============================================================
// PRIVACY
// ============================================================

$("privacyButton")?.addEventListener(
    "click",
    () => {

        openModal(
            "privacyModal"
        );

    }
);


// ============================================================
// SAFETY
// ============================================================

$("safetyButton")?.addEventListener(
    "click",
    () => {

        openModal(
            "safetyModal"
        );

    }
);


// ============================================================
// MENU
// ============================================================

$("menuButton")?.addEventListener(
    "click",
    () => {

        const navigation =
            $("mainNavigation");

        if (!navigation) return;


        const isOpen =
            navigation.classList.toggle(
                "mobile-open"
            );


        $("menuButton")
            .setAttribute(
                "aria-expanded",
                String(isOpen)
            );

    }
);


// ============================================================
// CLOSE MENU AFTER LINK
// ============================================================

$$(".desktop-nav a").forEach(
    link => {

        link.addEventListener(
            "click",
            () => {

                $("mainNavigation")
                    ?.classList.remove(
                        "mobile-open"
                    );

                $("menuButton")
                    ?.setAttribute(
                        "aria-expanded",
                        "false"
                    );

            }
        );

    }
);


// ============================================================
// INSTALL APP
// ============================================================

window.addEventListener(
    "beforeinstallprompt",
    event => {

        event.preventDefault();

        deferredInstallPrompt =
            event;

        $("installButton")
            ?.classList.remove(
                "hidden"
            );

    }
);


$("installButton")?.addEventListener(
    "click",
    async () => {

        if (!deferredInstallPrompt) {

            showToast(
                "Use your browser menu and choose Install App.",
                "info"
            );

            return;

        }


        deferredInstallPrompt.prompt();

        await deferredInstallPrompt.userChoice;

        deferredInstallPrompt =
            null;

        $("installButton")
            ?.classList.add(
                "hidden"
            );

    }
);


// ============================================================
// INSTALLED EVENT
// ============================================================

window.addEventListener(
    "appinstalled",
    () => {

        $("installButton")
            ?.classList.add(
                "hidden"
            );

        showToast(
            "FIX MY WORK installed successfully.",
            "success"
        );

    }
);


// ============================================================
// FORMAT TIMESTAMP
// ============================================================

function formatTimestamp(
    timestamp
) {

    if (!timestamp) {

        return "Recently";

    }


    try {

        const date =
            timestamp.toDate
                ? timestamp.toDate()
                : new Date(timestamp);


        return date.toLocaleString(
            "en-IN",
            {

                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit"

            }
        );

    } catch {

        return "Recently";

    }

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// KEYBOARD ESCAPE
// ============================================================

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "Escape") return;


        document
            .querySelectorAll(
                ".modal:not(.hidden)"
            )
            .forEach(
                modal => {

                    closeModal(
                        modal.id
                    );

                }
            );

    }
);


// ============================================================
// INITIAL PAGE SETUP
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        updateAuthModal();

        console.log(
            "FIX MY WORK Customer App loaded."
        );

    }
);
