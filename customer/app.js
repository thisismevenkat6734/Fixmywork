/* =========================================================
   FIX MY WORK — CUSTOMER APPLICATION
   Firebase Auth + Firestore + Cloudinary + Location + Map
   ========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile
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
   1. FIREBASE CONFIG
   ========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyCP8DGLQMXPUsv_p2zQ-NLkziwPQe1XkgU",
    authDomain: "fixmywork-d83ba.firebaseapp.com",
    databaseURL:
        "https://fixmywork-d83ba-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "fixmywork-d83ba",
    storageBucket: "fixmywork-d83ba.firebasestorage.app",
    messagingSenderId: "207313302232",
    appId: "1:207313302232:web:73055348982ad84abeddad",
    measurementId: "G-11FQMLCBQY"
};

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const db = getFirestore(firebaseApp);


/* =========================================================
   2. CLOUDINARY
   ========================================================= */

const CLOUDINARY_CLOUD_NAME = "lqfozcs3";

const CLOUDINARY_UPLOAD_PRESET = "fixmywork_upload";


/* =========================================================
   3. SUPPORT
   ========================================================= */

const SUPPORT_EMAIL = "fixmywork6734@gmail.com";


/* =========================================================
   4. SERVICES
   ========================================================= */

const MAIN_SERVICES = [
    "Electrical",
    "Plumbing",
    "AC Repair",
    "RO Repair",
    "Appliance Repair",
    "Painting",
    "Carpentry"
];

const OTHER_SERVICES = [
    "Washing Machine Repair",
    "Refrigerator Repair",
    "TV Repair",
    "Microwave Repair",
    "Geyser Repair",
    "CCTV Installation",
    "Internet / WiFi",
    "DTH / Set Top Box",
    "Computer Repair",
    "Laptop Repair",
    "Mobile Repair",
    "Inverter Repair",
    "Solar Services",
    "Pest Control",
    "Cleaning",
    "Bathroom Cleaning",
    "Home Deep Cleaning",
    "Water Tank Cleaning",
    "Packers & Movers",
    "Gardening",
    "Masonry",
    "False Ceiling",
    "Glass Work",
    "Tile Work",
    "Welding",
    "Furniture Assembly",
    "Car Wash",
    "Bike Repair",
    "Car Repair",
    "Locksmith",
    "RO Installation",
    "AC Installation",
    "AC Gas Filling",
    "Plumbing Installation",
    "Electrical Installation",
    "Other"
];


/* =========================================================
   5. STATE
   ========================================================= */

let currentUser = null;

let customerEmail = "";

let customerName = "";

let customerPhone = "";

let customerPhotoURL = "";

let selectedService = "";

let currentLocation = {
    latitude: null,
    longitude: null,
    address: ""
};

let map = null;

let customerMarker = null;

let workerMarkers = [];

let customerWorksUnsubscribe = null;

let workerSnapshotUnsubscribe = null;


/* =========================================================
   6. DOM HELPERS
   ========================================================= */

const getElement = (id) =>
    document.getElementById(id);

const authModal =
    getElement("authModal");

const serviceModal =
    getElement("serviceModal");

const authForm =
    getElement("authForm");

const serviceForm =
    getElement("serviceForm");

const serviceSelect =
    getElement("serviceSelect");

const serviceDescription =
    getElement("problemDescription");

const serviceAddress =
    getElement("serviceAddress");

const servicePhoto =
    getElement("servicePhoto");

const photoPreview =
    getElement("photoPreview");

const worksContainer =
    getElement("worksContainer");

const toastContainer =
    getElement("toastContainer");

const authButton =
    getElement("authButton");

const locationButton =
    getElement("locationButton");

const useLocationButton =
    getElement("useLocationButton");

const requestServiceButton =
    getElement("requestServiceButton");

const emptyRequestButton =
    getElement("emptyRequestButton");

const supportButton =
    getElement("supportButton");

const menuButton =
    getElement("menuButton");

const closeSafety =
    getElement("closeSafety");

const safetyNotice =
    getElement("safetyNotice");

const mapStatus =
    getElement("mapStatus");

const nearbyCount =
    getElement("nearbyCount");

const currentYear =
    getElement("currentYear");


/* =========================================================
   7. UTILITIES
   ========================================================= */

function showToast(message, type = "normal") {

    if (!toastContainer) {
        alert(message);
        return;
    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast ${type}`;

    toast.textContent =
        message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}


function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


function formatDate(timestamp) {

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

    if (!modal) return;

    modal.classList.remove("hidden");

    document.body.style.overflow =
        "hidden";
}


function closeModal(modal) {

    if (!modal) return;

    modal.classList.add("hidden");

    document.body.style.overflow =
        "";
}


/* =========================================================
   8. MODAL CLOSE
   ========================================================= */

document
    .querySelectorAll("[data-close-modal]")
    .forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                closeModal(
                    getElement(
                        button.dataset.closeModal
                    )
                );

            }
        );

    });


document
    .querySelectorAll(".modal")
    .forEach((modal) => {

        modal.addEventListener(
            "click",
            (event) => {

                if (
                    event.target === modal
                ) {
                    closeModal(modal);
                }

            }
        );

    });


document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape"
        ) {

            closeModal(authModal);

            closeModal(serviceModal);

        }

    }
);


/* =========================================================
   9. AUTH UI
   ========================================================= */

let authMode = "login";


function prepareAuthForm() {

    if (!authForm) return;

    authForm.innerHTML = `
        <div class="auth-tabs"
             style="
                display:flex;
                gap:8px;
                margin-bottom:18px;
             ">

            <button
                type="button"
                id="loginModeButton"
                class="secondary-button"
                style="flex:1"
            >
                Login
            </button>

            <button
                type="button"
                id="signupModeButton"
                class="secondary-button"
                style="flex:1"
            >
                Create Account
            </button>

        </div>

        <label for="authName">
            Full name
        </label>

        <input
            id="authName"
            type="text"
            autocomplete="name"
            placeholder="Your full name"
        >

        <label for="authPhone">
            Mobile number
        </label>

        <input
            id="authPhone"
            type="tel"
            inputmode="numeric"
            maxlength="10"
            autocomplete="tel"
            placeholder="10-digit mobile number"
        >

        <label for="authEmail">
            Email address
        </label>

        <input
            id="authEmail"
            type="email"
            autocomplete="email"
            required
            placeholder="you@example.com"
        >

        <label for="authPassword">
            Password
        </label>

        <input
            id="authPassword"
            type="password"
            autocomplete="current-password"
            minlength="6"
            required
            placeholder="Minimum 6 characters"
        >

        <label
            for="authPhoto"
            id="authPhotoLabel"
            style="display:none"
        >
            Profile photo
        </label>

        <input
            id="authPhoto"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style="display:none"
        >

        <button
            class="primary-button full"
            type="submit"
            id="authSubmitButton"
        >
            Login
        </button>

        <p
            id="authSwitchText"
            class="modal-note"
            style="cursor:pointer"
        >
            New customer? Create an account.
        </p>
    `;

    const name =
        getElement("authName");

    const phone =
        getElement("authPhone");

    const photo =
        getElement("authPhoto");

    const photoLabel =
        getElement("authPhotoLabel");

    if (authMode === "login") {

        name.style.display = "none";
        phone.style.display = "none";
        photo.style.display = "none";
        photoLabel.style.display = "none";

    } else {

        name.style.display = "block";
        phone.style.display = "block";
        photo.style.display = "block";
        photoLabel.style.display = "block";

    }

    getElement(
        "authSubmitButton"
    ).textContent =
        authMode === "login"
            ? "Login"
            : "Create Account";

    getElement(
        "authSwitchText"
    ).textContent =
        authMode === "login"
            ? "New customer? Create an account."
            : "Already have an account? Login.";

    getElement(
        "loginModeButton"
    ).addEventListener(
        "click",
        () => {

            authMode = "login";

            prepareAuthForm();

        }
    );

    getElement(
        "signupModeButton"
    ).addEventListener(
        "click",
        () => {

            authMode = "signup";

            prepareAuthForm();

        }
    );

    getElement(
        "authSwitchText"
    ).addEventListener(
        "click",
        () => {

            authMode =
                authMode === "login"
                    ? "signup"
                    : "login";

            prepareAuthForm();

        }
    );
}


prepareAuthForm();


/* =========================================================
   10. AUTH BUTTON
   ========================================================= */

authButton?.addEventListener(
    "click",
    () => {

        if (currentUser) {

            openCustomerAccount();

            return;
        }

        authMode = "login";

        prepareAuthForm();

        openModal(authModal);

    }
);


/* =========================================================
   11. LOGIN / SIGNUP
   ========================================================= */

authForm?.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const email =
            getElement("authEmail")
                ?.value
                .trim()
                .toLowerCase();

        const password =
            getElement("authPassword")
                ?.value || "";

        const name =
            getElement("authName")
                ?.value
                .trim() || "";

        const phone =
            getElement("authPhone")
                ?.value
                .trim() || "";

        const photo =
            getElement("authPhoto");

        if (!email || !password) {

            showToast(
                "Enter email and password.",
                "error"
            );

            return;
        }

        if (authMode === "signup") {

            if (!name) {

                showToast(
                    "Please enter your name.",
                    "error"
                );

                return;
            }

            if (!/^[0-9]{10}$/.test(phone)) {

                showToast(
                    "Enter a valid 10-digit mobile number.",
                    "error"
                );

                return;
            }

        }

        const submitButton =
            getElement(
                "authSubmitButton"
            );

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent =
                authMode === "login"
                    ? "Logging in..."
                    : "Creating account...";
        }

        try {

            let userCredential;

            if (authMode === "login") {

                userCredential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );

            } else {

                userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );

                const user =
                    userCredential.user;

                let uploadedPhoto = null;

                if (
                    photo?.files?.length
                ) {

                    uploadedPhoto =
                        await uploadImageToCloudinary(
                            photo.files[0]
                        );

                }

                await updateProfile(
                    user,
                    {
                        displayName: name,
                        photoURL:
                            uploadedPhoto?.url || null
                    }
                );

                await setDoc(
                    doc(
                        db,
                        "customers",
                        user.uid
                    ),
                    {
                        uid: user.uid,
                        name,
                        email,
                        phone,
                        profilePhoto:
                            uploadedPhoto?.url || "",
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

            const user =
                userCredential.user;

            await loadCustomerProfile(
                user.uid
            );

            closeModal(authModal);

            showToast(
                authMode === "login"
                    ? "Login successful."
                    : "Account created successfully.",
                "success"
            );

        } catch (error) {

            console.error(
                "Authentication error:",
                error
            );

            let message =
                "Authentication failed. Please try again.";

            if (
                error.code ===
                "auth/invalid-credential"
            ) {
                message =
                    "Incorrect email or password.";
            }

            if (
                error.code ===
                "auth/email-already-in-use"
            ) {
                message =
                    "This email is already registered.";
            }

            if (
                error.code ===
                "auth/weak-password"
            ) {
                message =
                    "Password must contain at least 6 characters.";
            }

            showToast(
                message,
                "error"
            );

        } finally {

            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    authMode === "login"
                        ? "Login"
                        : "Create Account";

            }

        }

    }
);


/* =========================================================
   12. CUSTOMER PROFILE
   ========================================================= */

async function loadCustomerProfile(uid) {

    try {

        const customerQuery =
            query(
                collection(
                    db,
                    "customers"
                ),
                where(
                    "uid",
                    "==",
                    uid
                )
            );

        /*
          This query is not required for normal operation.
          Main profile data is loaded through the
          auth user and customer document below.
        */

        void customerQuery;

        customerEmail =
            currentUser?.email || "";

        customerName =
            currentUser?.displayName || "";

        customerPhotoURL =
            currentUser?.photoURL || "";

        customerPhone = "";

    } catch (error) {

        console.warn(
            "Profile loading warning:",
            error
        );

    }

}


async function openCustomerAccount() {

    if (!currentUser) {
        openModal(authModal);
        return;
    }

    const accountModal =
        document.createElement("div");

    accountModal.className =
        "modal";

    accountModal.style.display =
        "flex";

    accountModal.innerHTML = `
        <div class="modal-card">

            <button
                class="modal-close"
                type="button"
                id="closeAccountModal"
            >
                ×
            </button>

            <span class="eyebrow">
                MY ACCOUNT
            </span>

            <h2>
                Customer Profile
            </h2>

            <div
                style="
                    text-align:center;
                    margin:20px 0;
                "
            >

                ${
                    currentUser.photoURL
                        ? `
                            <img
                                src="${escapeHTML(
                                    currentUser.photoURL
                                )}"
                                style="
                                    width:90px;
                                    height:90px;
                                    object-fit:cover;
                                    border-radius:50%;
                                "
                            >
                        `
                        : `
                            <div
                                style="
                                    width:90px;
                                    height:90px;
                                    margin:auto;
                                    border-radius:50%;
                                    background:#e8eef5;
                                    display:flex;
                                    align-items:center;
                                    justify-content:center;
                                    font-size:40px;
                                "
                            >
                                👤
                            </div>
                        `
                }

            </div>

            <label>
                Full name
            </label>

            <input
                id="profileNameInput"
                type="text"
                value="${escapeHTML(
                    currentUser.displayName || ""
                )}"
            >

            <label>
                Mobile number
            </label>

            <input
                id="profilePhoneInput"
                type="tel"
                maxlength="10"
                value="${escapeHTML(
                    customerPhone || ""
                )}"
                placeholder="10-digit mobile number"
            >

            <label>
                Profile photo
            </label>

            <input
                id="profilePhotoInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
            >

            <button
                id="saveProfileButton"
                class="primary-button full"
                type="button"
            >
                Save Profile
            </button>

            <button
                id="logoutButton"
                class="secondary-button full"
                type="button"
                style="margin-top:10px"
            >
                Logout
            </button>

        </div>
    `;

    document.body.appendChild(
        accountModal
    );

    getElement(
        "closeAccountModal"
    ).onclick = () => {

        accountModal.remove();

        document.body.style.overflow =
            "";

    };

    getElement(
        "saveProfileButton"
    ).onclick =
        async () => {

            const name =
                getElement(
                    "profileNameInput"
                )
                    .value
                    .trim();

            const phone =
                getElement(
                    "profilePhoneInput"
                )
                    .value
                    .trim();

            const photo =
                getElement(
                    "profilePhotoInput"
                );

            if (!name) {

                showToast(
                    "Enter your name.",
                    "error"
                );

                return;
            }

            if (
                phone &&
                !/^[0-9]{10}$/.test(phone)
            ) {

                showToast(
                    "Enter a valid mobile number.",
                    "error"
                );

                return;
            }

            try {

                let photoURL =
                    currentUser.photoURL || "";

                if (
                    photo?.files?.length
                ) {

                    const uploaded =
                        await uploadImageToCloudinary(
                            photo.files[0]
                        );

                    photoURL =
                        uploaded.url;

                }

                await updateProfile(
                    currentUser,
                    {
                        displayName: name,
                        photoURL
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
                        name,
                        email:
                            currentUser.email || "",
                        phone,
                        profilePhoto:
                            photoURL,
                        updatedAt:
                            serverTimestamp()
                    },
                    {
                        merge: true
                    }
                );

                customerName = name;
                customerPhone = phone;
                customerPhotoURL = photoURL;

                showToast(
                    "Profile updated.",
                    "success"
                );

                accountModal.remove();

                document.body.style.overflow =
                    "";

            } catch (error) {

                console.error(
                    "Profile update error:",
                    error
                );

                showToast(
                    "Could not update profile.",
                    "error"
                );

            }

        };


    getElement(
        "logoutButton"
    ).onclick =
        async () => {

            try {

                await signOut(auth);

                accountModal.remove();

                document.body.style.overflow =
                    "";

                showToast(
                    "Logged out successfully.",
                    "success"
                );

            } catch (error) {

                console.error(error);

                showToast(
                    "Could not logout.",
                    "error"
                );

            }

        };

}


/* =========================================================
   13. AUTH STATE
   ========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        currentUser = user;

        if (!user) {

            customerEmail = "";
            customerName = "";
            customerPhone = "";
            customerPhotoURL = "";

            if (authButton) {
                authButton.textContent =
                    "Login";
            }

            if (
                customerWorksUnsubscribe
            ) {

                customerWorksUnsubscribe();

                customerWorksUnsubscribe =
                    null;

            }

            return;
        }

        customerEmail =
            user.email || "";

        customerName =
            user.displayName || "";

        customerPhotoURL =
            user.photoURL || "";

        if (authButton) {
            authButton.textContent =
                "My Account";
        }

        await loadCustomerProfile(
            user.uid
        );

        loadCustomerWorks(
            user.uid
        );

    }
);


/* =========================================================
   14. SERVICE MODAL
   ========================================================= */

function openServiceModal(service = "") {

    if (!currentUser) {

        authMode = "login";

        prepareAuthForm();

        openModal(authModal);

        showToast(
            "Please login before requesting a service.",
            "error"
        );

        return;
    }

    selectedService =
        service;

    if (
        serviceSelect &&
        service
    ) {

        if (
            service === "Other"
        ) {

            serviceSelect.value =
                "Other Services";

        } else {

            serviceSelect.value =
                service;

        }

    }

    updateSelectedServiceText();

    addMobileFieldToServiceForm();

    openModal(
        serviceModal
    );

}


function updateSelectedServiceText() {

    const selectedText =
        getElement(
            "selectedServiceText"
        );

    if (!selectedText) return;

    selectedText.textContent =
        selectedService
            ? `Requesting ${selectedService}. Tell us what you need.`
            : "Tell us what you need.";

}


requestServiceButton?.addEventListener(
    "click",
    () => openServiceModal()
);


emptyRequestButton?.addEventListener(
    "click",
    () => openServiceModal()
);


/* =========================================================
   15. SERVICE CARDS
   ========================================================= */

document
    .querySelectorAll(".service-card")
    .forEach((card) => {

        card.addEventListener(
            "click",
            () => {

                const service =
                    card.dataset.service || "";

                if (
                    service === "Other"
                ) {

                    openOtherServicesPicker();

                } else {

                    openServiceModal(
                        service
                    );

                }

            }
        );

    });


/* =========================================================
   16. SERVICE SELECT
   ========================================================= */

serviceSelect?.addEventListener(
    "change",
    () => {

        const value =
            serviceSelect.value;

        if (
            value ===
            "Other Services"
        ) {

            openOtherServicesPicker();

            return;

        }

        selectedService =
            value;

        updateSelectedServiceText();

    }
);


/* =========================================================
   17. OTHER SERVICES PICKER
   ========================================================= */

function openOtherServicesPicker() {

    const picker =
        document.createElement("div");

    picker.className =
        "modal";

    picker.style.display =
        "flex";

    picker.innerHTML = `
        <div
            class="modal-card large-modal"
            style="max-height:85vh;overflow:auto"
        >

            <button
                type="button"
                class="modal-close"
                id="closeOtherPicker"
            >
                ×
            </button>

            <span class="eyebrow">
                OTHER SERVICES
            </span>

            <h2>
                Select the work you need
            </h2>

            <p>
                Choose the service that matches your requirement.
            </p>

            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(auto-fit,minmax(180px,1fr));
                    gap:10px;
                    margin-top:20px;
                "
            >

                ${OTHER_SERVICES
                    .map(
                        (service) => `
                            <button
                                type="button"
                                class="other-service-option secondary-button"
                                data-other-service="${escapeHTML(
                                    service
                                )}"
                                style="
                                    text-align:left;
                                    min-height:55px;
                                "
                            >
                                🛠️
                                ${escapeHTML(service)}
                            </button>
                        `
                    )
                    .join("")}

            </div>

        </div>
    `;

    document.body.appendChild(
        picker
    );

    getElement(
        "closeOtherPicker"
    ).onclick =
        () => picker.remove();

    picker
        .querySelectorAll(
            ".other-service-option"
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    selectedService =
                        button.dataset.otherService;

                    picker.remove();

                    if (
                        serviceSelect
                    ) {

                        let existing =
                            Array.from(
                                serviceSelect.options
                            ).find(
                                option =>
                                    option.value ===
                                    selectedService
                            );

                        if (!existing) {

                            existing =
                                document.createElement(
                                    "option"
                                );

                            existing.value =
                                selectedService;

                            existing.textContent =
                                selectedService;

                            serviceSelect.appendChild(
                                existing
                            );

                        }

                        serviceSelect.value =
                            selectedService;

                    }

                    updateSelectedServiceText();

                    addMobileFieldToServiceForm();

                    openModal(
                        serviceModal
                    );

                }
            );

        });

}


/* =========================================================
   18. MOBILE NUMBER IN REQUEST
   ========================================================= */

function addMobileFieldToServiceForm() {

    if (!serviceForm) return;

    if (
        getElement(
            "serviceMobile"
        )
    ) {
        return;
    }

    const label =
        document.createElement("label");

    label.htmlFor =
        "serviceMobile";

    label.textContent =
        "Mobile number";

    const input =
        document.createElement("input");

    input.id =
        "serviceMobile";

    input.name =
        "mobile";

    input.type =
        "tel";

    input.inputMode =
        "numeric";

    input.maxLength =
        10;

    input.required =
        true;

    input.placeholder =
        "10-digit mobile number";

    input.value =
        customerPhone || "";

    const addressLabel =
        serviceForm.querySelector(
            'label[for="serviceAddress"]'
        );

    if (
        addressLabel
    ) {

        serviceForm.insertBefore(
            label,
            addressLabel
        );

        serviceForm.insertBefore(
            input,
            addressLabel
        );

    } else {

        serviceForm.prepend(input);

        serviceForm.prepend(label);

    }

}


/* =========================================================
   19. PHOTO PREVIEW
   ========================================================= */

servicePhoto?.addEventListener(
    "change",
    () => {

        if (!photoPreview) return;

        photoPreview.innerHTML = "";

        const files =
            Array.from(
                servicePhoto.files || []
            );

        files
            .slice(0, 6)
            .forEach(
                (file) => {

                    if (
                        !file.type.startsWith(
                            "image/"
                        )
                    ) {
                        return;
                    }

                    const image =
                        document.createElement(
                            "img"
                        );

                    image.alt =
                        "Selected service photo";

                    image.style.maxWidth =
                        "100px";

                    image.style.maxHeight =
                        "100px";

                    image.style.objectFit =
                        "cover";

                    const reader =
                        new FileReader();

                    reader.onload =
                        () => {

                            image.src =
                                reader.result;

                            photoPreview.appendChild(
                                image
                            );

                        };

                    reader.readAsDataURL(
                        file
                    );

                }
            );

    }
);


/* =========================================================
   20. CLOUDINARY UPLOAD
   ========================================================= */

async function uploadImageToCloudinary(
    file
) {

    const uploadURL =
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

    const result =
        await response.json();

    return {
        url:
            result.secure_url,

        publicId:
            result.public_id
    };

}


async function uploadServicePhotos(
    files
) {

    const validFiles =
        Array.from(files || [])
            .filter(
                file =>
                    file.type.startsWith(
                        "image/"
                    )
            )
            .slice(0, 6);

    const results = [];

    for (
        const file
        of validFiles
    ) {

        results.push(
            await uploadImageToCloudinary(
                file
            )
        );

    }

    return results;

}


/* =========================================================
   21. CUSTOMER LOCATION
   ========================================================= */

function requestCustomerLocation() {

    if (
        !navigator.geolocation
    ) {

        showToast(
            "Location is not supported on this device.",
            "error"
        );

        return;
    }

    if (mapStatus) {

        mapStatus.textContent =
            "Getting your location...";

    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            currentLocation.latitude =
                latitude;

            currentLocation.longitude =
                longitude;

            updateCustomerMap(
                latitude,
                longitude
            );

            await reverseGeocode(
                latitude,
                longitude
            );

            if (mapStatus) {

                mapStatus.textContent =
                    "Your location is ready";

            }

            if (nearbyCount) {

                nearbyCount.textContent =
                    "Finding nearby professionals...";

            }

            loadNearbyWorkers(
                latitude,
                longitude
            );

            if (
                serviceAddress &&
                currentLocation.address
            ) {

                serviceAddress.value =
                    currentLocation.address;

            }

            const locationText =
                getElement(
                    "locationText"
                );

            if (locationText) {

                locationText.textContent =
                    "Location Ready";

            }

            showToast(
                "Location detected successfully.",
                "success"
            );

        },

        (error) => {

            console.error(
                "Location error:",
                error
            );

            if (mapStatus) {

                mapStatus.textContent =
                    "Location permission required";

            }

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


locationButton?.addEventListener(
    "click",
    requestCustomerLocation
);


useLocationButton?.addEventListener(
    "click",
    requestCustomerLocation
);


/* =========================================================
   22. REVERSE GEOCODING
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
   23. LEAFLET
   ========================================================= */

function loadLeaflet() {

    return new Promise(
        (resolve, reject) => {

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

            const style =
                document.createElement(
                    "link"
                );

            style.rel =
                "stylesheet";

            style.href =
                "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

            document.head.appendChild(
                style
            );

            const script =
                document.createElement(
                    "script"
                );

            script.src =
                "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

            script.async =
                true;

            script.dataset.leaflet =
                "true";

            script.onload =
                () => resolve(window.L);

            script.onerror =
                reject;

            document.head.appendChild(
                script
            );

        }
    );

}


/* =========================================================
   24. MAP
   ========================================================= */

async function initializeMap() {

    const mapElement =
        getElement("map");

    if (!mapElement) return;

    try {

        const L =
            await loadLeaflet();

        map =
            L.map(
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
                attribution:
                    "&copy; OpenStreetMap contributors"
            }
        ).addTo(map);

    } catch (error) {

        console.error(
            "Map initialization error:",
            error
        );

    }

}


function updateCustomerMap(
    latitude,
    longitude
) {

    if (
        !map ||
        !window.L
    ) {
        return;
    }

    if (
        customerMarker
    ) {
        customerMarker.remove();
    }

    customerMarker =
        window.L.marker(
            [
                latitude,
                longitude
            ]
        )
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
   25. DISTANCE
   ========================================================= */

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadius =
        6371;

    const latitudeDifference =
        (lat2 - lat1) *
        Math.PI /
        180;

    const longitudeDifference =
        (lon2 - lon1) *
        Math.PI /
        180;

    const a =
        Math.sin(
            latitudeDifference / 2
        ) ** 2 +

        Math.cos(
            lat1 * Math.PI / 180
        ) *

        Math.cos(
            lat2 * Math.PI / 180
        ) *

        Math.sin(
            longitudeDifference / 2
        ) ** 2;

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
   26. NEARBY WORKERS
   ========================================================= */

function loadNearbyWorkers(
    latitude,
    longitude
) {

    if (
        !map ||
        !window.L
    ) {
        return;
    }

    workerMarkers.forEach(
        marker => marker.remove()
    );

    workerMarkers = [];

    if (
        workerSnapshotUnsubscribe
    ) {

        workerSnapshotUnsubscribe();

        workerSnapshotUnsubscribe =
            null;

    }

    try {

        const workersQuery =
            query(
                collection(
                    db,
                    "workers"
                ),
                where(
                    "approved",
                    "==",
                    true
                )
            );

        workerSnapshotUnsubscribe =
            onSnapshot(
                workersQuery,
                (snapshot) => {

                    let nearbyWorkers =
                        0;

                    snapshot.forEach(
                        (workerDoc) => {

                            const worker =
                                workerDoc.data();

                            const workerLatitude =
                                Number(
                                    worker.latitude
                                );

                            const workerLongitude =
                                Number(
                                    worker.longitude
                                );

                            if (
                                !Number.isFinite(
                                    workerLatitude
                                ) ||
                                !Number.isFinite(
                                    workerLongitude
                                )
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

                            if (
                                distance > 25
                            ) {
                                return;
                            }

                            nearbyWorkers++;

                            const marker =
                                window.L
                                    .marker(
                                        [
                                            workerLatitude,
                                            workerLongitude
                                        ]
                                    )
                                    .addTo(map)
                                    .bindPopup(`
                                        <strong>
                                            ${escapeHTML(
                                                worker.name ||
                                                "Service Professional"
                                            )}
                                        </strong>
                                        <br>
                                        ${distance.toFixed(
                                            1
                                        )} km away
                                    `);

                            workerMarkers.push(
                                marker
                            );

                        }
                    );

                    if (nearbyCount) {

                        nearbyCount.textContent =
                            nearbyWorkers > 0
                                ? `${nearbyWorkers} professional${nearbyWorkers === 1 ? "" : "s"} nearby`
                                : "No professionals found nearby";

                    }

                },
                (error) => {

                    console.warn(
                        "Worker map unavailable:",
                        error
                    );

                    if (nearbyCount) {

                        nearbyCount.textContent =
                            "Nearby professionals will appear here";

                    }

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
   27. SERVICE REQUEST
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

        const description =
            serviceDescription
                ?.value
                .trim();

        const address =
            serviceAddress
                ?.value
                .trim();

        const mobile =
            getElement(
                "serviceMobile"
            )
                ?.value
                .trim() || "";

        if (!service) {

            showToast(
                "Please select a service.",
                "error"
            );

            return;
        }

        if (
            !description
        ) {

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
            !/^[0-9]{10}$/.test(mobile)
        ) {

            showToast(
                "Please enter a valid 10-digit mobile number.",
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

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "Creating request...";

            }

            let photoData = [];

            if (
                servicePhoto?.files?.length
            ) {

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

                customerId:
                    currentUser.uid,

                customerName:
                    customerName ||
                    currentUser.displayName ||
                    "",

                customerEmail:
                    currentUser.email ||
                    "",

                customerPhone:
                    mobile,

                customerPhoto:
                    customerPhotoURL ||
                    currentUser.photoURL ||
                    "",

                service,

                description,

                address,

                latitude:
                    currentLocation.latitude,

                longitude:
                    currentLocation.longitude,

                photos:
                    photoData,

                status:
                    "pending",

                assignedWorkerId:
                    null,

                assignedWorkerName:
                    null,

                customerRating:
                    null,

                customerFeedback:
                    "",

                completionPhoto:
                    "",

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
                    uid:
                        currentUser.uid,

                    name:
                        customerName ||
                        currentUser.displayName ||
                        "",

                    email:
                        currentUser.email ||
                        "",

                    phone:
                        mobile,

                    profilePhoto:
                        customerPhotoURL ||
                        currentUser.photoURL ||
                        "",

                    updatedAt:
                        serverTimestamp()
                },
                {
                    merge: true
                }
            );

            customerPhone =
                mobile;

            closeModal(
                serviceModal
            );

            serviceForm.reset();

            if (photoPreview) {
                photoPreview.innerHTML =
                    "";
            }

            selectedService =
                "";

            showToast(
                "Service request sent successfully.",
                "success"
            );

            console.log(
                "Request created:",
                requestReference.id
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

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    originalText;

            }

        }

    }
);


/* =========================================================
   28. MY WORKS
   ONLY COMPLETED WORKS
   ========================================================= */

function loadCustomerWorks(
    customerId
) {

    if (!worksContainer) {
        return;
    }

    if (
        customerWorksUnsubscribe
    ) {

        customerWorksUnsubscribe();

        customerWorksUnsubscribe =
            null;

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
                customerId
            )
        );

    customerWorksUnsubscribe =
        onSnapshot(
            worksQuery,
            (snapshot) => {

                const works = [];

                snapshot.forEach(
                    (workDoc) => {

                        const data =
                            workDoc.data();

                        /*
                         * IMPORTANT:
                         * My Works shows ONLY completed
                         * customer jobs.
                         */

                        if (
                            data.status !==
                            "completed"
                        ) {
                            return;
                        }

                        works.push({
                            id:
                                workDoc.id,
                            ...data
                        });

                    }
                );

                works.sort(
                    (a, b) => {

                        const aTime =
                            a.createdAt
                                ?.toMillis?.() ||
                            0;

                        const bTime =
                            b.createdAt
                                ?.toMillis?.() ||
                            0;

                        return (
                            bTime -
                            aTime
                        );

                    }
                );

                renderCustomerWorks(
                    works
                );

            },
            (error) => {

                console.error(
                    "Works loading error:",
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
   29. WORK CARD
   ========================================================= */

function renderCustomerWorks(
    works
) {

    if (!worksContainer) {
        return;
    }

    if (!works.length) {

        worksContainer.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    📋
                </div>

                <h3>
                    No completed works
                </h3>

                <p>
                    Your completed service works
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
        works
            .map(
                (work) => `

                    <article
                        class="work-card"
                        data-work-id="${escapeHTML(
                            work.id
                        )}"
                    >

                        <div
                            class="work-card-header"
                        >

                            <div>

                                <span
                                    class="work-service"
                                >
                                    ${escapeHTML(
                                        work.service ||
                                        "Service"
                                    )}
                                </span>

                                <small>
                                    ${formatDate(
                                        work.completedAt ||
                                        work.updatedAt ||
                                        work.createdAt
                                    )}
                                </small>

                            </div>

                            <span
                                class="work-status status-completed"
                            >
                                Completed
                            </span>

                        </div>

                        <p
                            class="work-description"
                        >
                            ${escapeHTML(
                                work.description ||
                                "No description"
                            )}
                        </p>

                        <div
                            class="work-location"
                        >
                            📍
                            ${escapeHTML(
                                work.address ||
                                "Location not available"
                            )}
                        </div>

                        ${
                            work.workerName ||
                            work.assignedWorkerName
                                ? `
                                    <div
                                        class="assigned-worker"
                                    >

                                        <strong>
                                            Professional
                                        </strong>

                                        <span>
                                            ${escapeHTML(
                                                work.workerName ||
                                                work.assignedWorkerName
                                            )}
                                        </span>

                                    </div>
                                `
                                : ""
                        }

                        ${
                            Array.isArray(
                                work.photos
                            ) &&
                            work.photos.length
                                ? `
                                    <div
                                        class="work-photos"
                                    >

                                        ${work.photos
                                            .map(
                                                photo => `
                                                    <img
                                                        src="${escapeHTML(
                                                            photo.url
                                                        )}"
                                                        alt="Service photo"
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
                            work.completionPhoto
                                ? `
                                    <div
                                        style="
                                            margin-top:15px;
                                        "
                                    >

                                        <strong>
                                            Completion photo
                                        </strong>

                                        <img
                                            src="${escapeHTML(
                                                work.completionPhoto
                                            )}"
                                            alt="Completed work"
                                            style="
                                                width:100%;
                                                max-width:350px;
                                                margin-top:8px;
                                                border-radius:12px;
                                            "
                                        >

                                    </div>
                                `
                                : ""
                        }

                        ${renderFeedbackSection(
                            work
                        )}

                    </article>
                `
            )
            .join("");

    bindFeedbackForms();

}


/* =========================================================
   30. FEEDBACK SECTION
   ========================================================= */

function renderFeedbackSection(
    work
) {

    if (
        Number(
            work.customerRating || 0
        ) > 0 ||
        work.customerFeedback
    ) {

        return `
            <div
                class="work-rating-complete"
                style="
                    margin-top:18px;
                    padding:15px;
                    border-radius:12px;
                    background:#f5f8fc;
                "
            >

                <strong>
                    Your Feedback
                </strong>

                <div
                    style="margin-top:7px"
                >
                    ⭐
                    ${Number(
                        work.customerRating || 0
                    )}/5
                </div>

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
        `;

    }

    return `
        <div
            class="work-rating"
            style="margin-top:20px"
        >

            <strong>
                How was the work?
            </strong>

            <form
                class="feedback-form"
                data-feedback-work="${escapeHTML(
                    work.id
                )}"
            >

                <div
                    class="rating-buttons"
                    style="
                        display:flex;
                        gap:6px;
                        flex-wrap:wrap;
                        margin:12px 0;
                    "
                >

                    ${[1,2,3,4,5]
                        .map(
                            number => `
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

                <input
                    type="hidden"
                    name="rating"
                    class="selected-rating"
                    value=""
                >

                <textarea
                    name="feedback"
                    rows="3"
                    maxlength="1000"
                    placeholder="Write your feedback..."
                    required
                ></textarea>

                <label
                    style="margin-top:10px"
                >
                    Add completion photo
                    <span>(optional)</span>
                </label>

                <input
                    type="file"
                    name="completionPhoto"
                    accept="image/jpeg,image/png,image/webp"
                >

                <button
                    class="primary-button full"
                    type="submit"
                    style="margin-top:12px"
                >
                    Submit Feedback
                </button>

            </form>

        </div>
    `;

}


/* =========================================================
   31. FEEDBACK FORM
   ========================================================= */

function bindFeedbackForms() {

    document
        .querySelectorAll(
            ".feedback-form"
        )
        .forEach(
            (form) => {

                const ratingButtons =
                    form.querySelectorAll(
                        ".rating-button"
                    );

                const ratingInput =
                    form.querySelector(
                        ".selected-rating"
                    );

                ratingButtons.forEach(
                    (button) => {

                        button.addEventListener(
                            "click",
                            () => {

                                ratingInput.value =
                                    button.dataset.rating;

                            }
                        );

                    }
                );

                form.addEventListener(
                    "submit",
                    async (event) => {

                        event.preventDefault();

                        const workId =
                            form.dataset.feedbackWork;

                        const rating =
                            Number(
                                ratingInput.value
                            );

                        const feedback =
                            form
                                .querySelector(
                                    '[name="feedback"]'
                                )
                                .value
                                .trim();

                        const photoInput =
                            form.querySelector(
                                '[name="completionPhoto"]'
                            );

                        if (
                            rating < 1 ||
                            rating > 5
                        ) {

                            showToast(
                                "Please select a rating.",
                                "error"
                            );

                            return;
                        }

                        if (!feedback) {

                            showToast(
                                "Please write your feedback.",
                                "error"
                            );

                            return;
                        }

                        const submitButton =
                            form.querySelector(
                                'button[type="submit"]'
                            );

                        try {

                            submitButton.disabled =
                                true;

                            submitButton.textContent =
                                "Saving feedback...";

                            let completionPhoto =
                                "";

                            if (
                                photoInput
                                    ?.files
                                    ?.length
                            ) {

                                submitButton.textContent =
                                    "Uploading photo...";

                                const uploaded =
                                    await uploadImageToCloudinary(
                                        photoInput.files[0]
                                    );

                                completionPhoto =
                                    uploaded.url;

                            }

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

                                    completionPhoto,

                                    customerRatedAt:
                                        serverTimestamp(),

                                    updatedAt:
                                        serverTimestamp()
                                }
                            );

                            showToast(
                                "Thank you for your feedback!",
                                "success"
                            );

                        } catch (error) {

                            console.error(
                                "Feedback error:",
                                error
                            );

                            showToast(
                                "Could not save your feedback.",
                                "error"
                            );

                        } finally {

                            submitButton.disabled =
                                false;

                            submitButton.textContent =
                                "Submit Feedback";

                        }

                    }
                );

            }
        );

}


/* =========================================================
   32. SAFETY
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
   33. MOBILE MENU
   ========================================================= */

menuButton?.addEventListener(
    "click",
    () => {

        const navigation =
            document.querySelector(
                ".desktop-nav"
            );

        if (!navigation) return;

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
    .forEach(
        (link) => {

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

        }
    );


/* =========================================================
   34. SUPPORT EMAIL
   ========================================================= */

supportButton?.addEventListener(
    "click",
    () => {

        window.location.href =
            `mailto:${SUPPORT_EMAIL}?subject=FIX MY WORK Support`;

    }
);


/* =========================================================
   35. TERMS & PRIVACY
   ========================================================= */

function createLegalModal(
    title,
    content
) {

    const modal =
        document.createElement("div");

    modal.className =
        "modal";

    modal.style.display =
        "flex";

    modal.innerHTML = `
        <div
            class="modal-card large-modal"
            style="max-height:85vh;overflow:auto"
        >

            <button
                type="button"
                class="modal-close legal-close"
            >
                ×
            </button>

            <span class="eyebrow">
                FIX MY WORK
            </span>

            <h2>
                ${escapeHTML(title)}
            </h2>

            <div
                style="
                    line-height:1.7;
                    color:#475569;
                "
            >
                ${content}
            </div>

        </div>
    `;

    document.body.appendChild(
        modal
    );

    modal
        .querySelector(
            ".legal-close"
        )
        .onclick =
            () => modal.remove();

}


document
    .querySelectorAll(
        'a[href="#terms"]'
    )
    .forEach(
        link => {

            link.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();

                    createLegalModal(
                        "Terms & Conditions",
                        `
                            <h3>Using FIX MY WORK</h3>

                            <p>
                                FIX MY WORK connects customers
                                with local service professionals.
                            </p>

                            <h3>Service Requests</h3>

                            <p>
                                Customers must provide accurate
                                service information, location and
                                contact details.
                            </p>

                            <h3>Payments</h3>

                            <p>
                                Do not share OTPs, passwords or
                                banking credentials with anyone.
                                Payments should only be made through
                                officially authorised FIX MY WORK
                                payment methods.
                            </p>

                            <h3>Professional Services</h3>

                            <p>
                                Service quality, pricing and completion
                                must be handled according to the
                                applicable service agreement.
                            </p>

                            <h3>Safety</h3>

                            <p>
                                Report suspicious activity or unsafe
                                behaviour to FIX MY WORK support.
                            </p>
                        `
                    );

                }
            );

        }
    );


document
    .querySelectorAll(
        'a[href="#privacy"]'
    )
    .forEach(
        link => {

            link.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();

                    createLegalModal(
                        "Privacy Policy",
                        `
                            <h3>Information We Collect</h3>

                            <p>
                                FIX MY WORK may collect account details,
                                mobile number, service location,
                                service request information, photos
                                and feedback required to provide the
                                service.
                            </p>

                            <h3>How Information Is Used</h3>

                            <p>
                                Information is used to process requests,
                                connect customers with professionals,
                                maintain service history and provide
                                customer support.
                            </p>

                            <h3>Photos</h3>

                            <p>
                                Photos uploaded by customers may be used
                                for service-request and completion
                                purposes.
                            </p>

                            <h3>Security</h3>

                            <p>
                                We take reasonable measures to protect
                                account and service information.
                            </p>

                            <h3>Contact</h3>

                            <p>
                                For privacy questions contact
                                ${SUPPORT_EMAIL}.
                            </p>
                        `
                    );

                }
            );

        }
    );


/* =========================================================
   36. FOOTER YEAR
   ========================================================= */

if (currentYear) {

    currentYear.textContent =
        new Date().getFullYear();

}


/* =========================================================
   37. START APPLICATION
   ========================================================= */

async function startApplication() {

    try {

        await initializeMap();

        console.log(
            "FIX MY WORK customer application started."
        );

    } catch (error) {

        console.error(
            "Application startup error:",
            error
        );

    }

}


startApplication();
