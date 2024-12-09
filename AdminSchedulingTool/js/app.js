// Helper functions for LocalStorage
function saveToLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function loadFromLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key) || "[]");
}

// Initialize Forms and Tables
document.addEventListener("DOMContentLoaded", function () {
    const forms = [
        { formId: "facultyForm", tableId: "facultyTable", storageKey: "facultyData" },
        { formId: "courseForm", tableId: "courseTable", storageKey: "courseData" },
        { formId: "sectionForm", tableId: "sectionTable", storageKey: "sectionData" }
    ];

    forms.forEach(({ formId, tableId, storageKey }) => {
        const form = document.getElementById(formId);
        const table = document.getElementById(tableId);
        if (form && table) {
            setupForm(form, table, storageKey);
        }
    });

    // Timetable toggle logic
    const showTimetableButton = document.getElementById("showTimetableButton");
    const timetableContainer = document.getElementById("timetableContainer");

    if (showTimetableButton && timetableContainer) {
        showTimetableButton.addEventListener("click", () => {
            if (timetableContainer.classList.contains("hidden")) {
                timetableContainer.classList.remove("hidden");
                populateTimetable(); // Populate the timetable only when showing
                showTimetableButton.textContent = "Hide Timetable";
            } else {
                timetableContainer.classList.add("hidden");
                showTimetableButton.textContent = "Show Timetable";
            }
        });
    }
});

// Function to Set Up a Form and Associated Table
function setupForm(form, table, storageKey) {
    const customFieldsContainer = form.querySelector("#customFieldsContainer");
    const addFieldButton = form.querySelector("#addFieldButton");
    let editingIndex = null;

    // Add Custom Field
    if (addFieldButton) {
        addFieldButton.addEventListener("click", function () {
            const fieldId = `customField_${Date.now()}`;
            const fieldDiv = document.createElement("div");
            fieldDiv.classList.add("custom-field");
            fieldDiv.innerHTML = `
                <input type="text" id="${fieldId}_name" placeholder="Field Name" required>
                <input type="text" id="${fieldId}_value" placeholder="Field Value" required>
                <button type="button" class="remove-field-button">Remove</button>
            `;
            customFieldsContainer.appendChild(fieldDiv);

            // Attach remove functionality
            const removeButton = fieldDiv.querySelector(".remove-field-button");
            removeButton.addEventListener("click", function () {
                fieldDiv.remove();
            });
        });
    }

    // Submit Form
    form.addEventListener("submit", function (event) {
        event.preventDefault();

        // Collect Standard Fields
        const formData = {};
        Array.from(form.elements).forEach(input => {
            if (input.id && !input.classList.contains("custom-field")) {
                formData[input.id] = input.value;
            }
        });

        // Collect Custom Fields
        formData.customFields = [];
        const customFields = form.querySelectorAll(".custom-field");
        customFields.forEach(field => {
            const fieldName = field.querySelector("input:nth-child(1)").value;
            const fieldValue = field.querySelector("input:nth-child(2)").value;
            formData.customFields.push({ name: fieldName, value: fieldValue });
        });

        // Save Data
        let data = loadFromLocalStorage(storageKey);
        if (editingIndex !== null) {
            data[editingIndex] = formData; // Update existing entry
            editingIndex = null; // Reset editing index
        } else {
            data.push(formData); // Add new entry
        }
        saveToLocalStorage(storageKey, data);

        // Reload Table and Reset Form
        loadTable(table, data);
        form.reset();
        if (customFieldsContainer) customFieldsContainer.innerHTML = ""; // Clear custom fields
    });

    // Load Table Data
    const data = loadFromLocalStorage(storageKey);
    loadTable(table, data);

    // Edit and Delete Row Handlers
    table.addEventListener("click", function (event) {
        const target = event.target;
        const rowIndex = target.getAttribute("data-index");

        if (target.classList.contains("edit-button")) {
            // Edit Row
            editingIndex = parseInt(rowIndex, 10);
            const rowData = loadFromLocalStorage(storageKey)[editingIndex];
            populateForm(form, rowData, customFieldsContainer);
        } else if (target.classList.contains("delete-button")) {
            // Delete Row
            let data = loadFromLocalStorage(storageKey);
            data.splice(rowIndex, 1); // Remove the item at the specified index
            saveToLocalStorage(storageKey, data);
            loadTable(table, data);
        }
    });
}

// Populate Form with Existing Data for Editing
function populateForm(form, data, customFieldsContainer) {
    Object.entries(data).forEach(([key, value]) => {
        const input = form.querySelector(`#${key}`);
        if (input) {
            input.value = value;
        }
    });

    if (customFieldsContainer && data.customFields) {
        customFieldsContainer.innerHTML = data.customFields.map(field => `
            <div class="custom-field">
                <input type="text" value="${field.name}" placeholder="Field Name" required>
                <input type="text" value="${field.value}" placeholder="Field Value" required>
                <button type="button" class="remove-field-button">Remove</button>
            </div>
        `).join("");

        customFieldsContainer.querySelectorAll(".remove-field-button").forEach(button => {
            button.addEventListener("click", () => button.parentElement.remove());
        });
    }
}

// Load Data into the Table
function loadTable(table, data) {
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = data.map((item, index) => `
        <tr>
            ${Object.entries(item).map(([key, value]) => {
                if (key === "customFields") {
                    return `<td>${value.map(field => `${field.name}: ${field.value}`).join("<br>")}</td>`;
                } else {
                    return `<td>${value}</td>`;
                }
            }).join("")}
            <td>
                <button class="edit-button" data-index="${index}">Edit</button>
                <button class="delete-button" data-index="${index}">Delete</button>
            </td>
        </tr>
    `).join("");
}

// Filter/Search Function for Tables
function filterTable(tableId, searchValue) {
    const input = searchValue.toLowerCase(); // Convert input to lowercase for case-insensitive search
    const table = document.getElementById(tableId);
    if (!table) return; // If table is not found, exit
    const rows = table.getElementsByTagName("tr");

    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName("td");
        let rowMatches = false;

        for (let j = 0; j < cells.length; j++) {
            const cellText = cells[j].textContent.toLowerCase();
            if (cellText.includes(input)) {
                rowMatches = true;
                break;
            }
        }

        rows[i].style.display = rowMatches ? "" : "none"; // Show or hide the row
    }
}

// Toggle the Hamburger Menu
function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.classList.toggle('active');
}

// Populate Timetable with Section Data
function populateTimetable() {
    const timetableBody = document.querySelector(".timetable .body");
    const timeSlots = [
        "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
        "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
    ];

    timetableBody.innerHTML = ""; // Clear previous rows

    timeSlots.forEach((time) => {
        const row = document.createElement("div");
        row.classList.add("row");

        const timeCell = document.createElement("div");
        timeCell.classList.add("cell");
        timeCell.textContent = time;
        row.appendChild(timeCell);

        ["S", "M", "T", "W", "R", "F", "S"].forEach((day) => {
            const dayCell = document.createElement("div");
            dayCell.classList.add("cell");

            const sectionData = loadFromLocalStorage("sectionData").find(section => {
                return section.days.includes(day) && section.startTime === time;
            });

            if (sectionData) {
                dayCell.textContent = `${sectionData.courseName} (${sectionData.room})`;
                dayCell.classList.add("event");
            } else {
                dayCell.textContent = "-"; // Placeholder for empty slots
                dayCell.style.color = "#ccc"; // Lighten placeholder text
            }

            row.appendChild(dayCell);
        });

        timetableBody.appendChild(row);
    });
}

