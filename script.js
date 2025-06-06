// Quiz state variables
let currentQuestion = 0;
let score = 0;
let userAnswers = [];
let selectedAnswer = null;            // For multiple-choice, true-false
let dragDropAnswers = {};             // Updated to handle arrays for multiple items per zone
let matchingAnswers = {};
let fillBlankAnswers = [];
let selectedLeftItem = null;
let userName = ''; // New variable to store the user's name

// Color schemes for matching (can be moved to CSS or kept here)
const matchingColors = ['color-1', 'color-2', 'color-3', 'color-4'];

// Event listeners for quiz buttons
document.getElementById('startBtn').addEventListener('click', startQuiz);
document.getElementById('restartBtn').addEventListener('click', restartQuiz);

// Get references to elements
const userNameInput = document.getElementById('userNameInput');
const startBtn = document.getElementById('startBtn');
const displayUserNameSpan = document.getElementById('displayUserName'); // Span to display name on result screen

// Initial state: disable start button if name input is empty
if (userNameInput) {
    userNameInput.addEventListener('input', function() {
        startBtn.disabled = this.value.trim() === '';
    });
    startBtn.disabled = userNameInput.value.trim() === ''; // Disable on initial load if empty
}


/**
 * Initializes and starts the quiz.
 * Hides the start screen, shows the question screen, and resets quiz variables.
 */
function startQuiz() {
    userName = userNameInput.value.trim(); // Get user's name from input
    if (userName === '') {
        // Optionally, you could show a more user-friendly message here instead of just returning
        return; // Don't start quiz if name is empty
    }

    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('questionScreen').style.display = 'block';
    currentQuestion = 0;
    score = 0;
    userAnswers = [];
    selectedAnswer = null;
    dragDropAnswers = {};
    matchingAnswers = {};
    fillBlankAnswers = [];
    selectedLeftItem = null;
    showQuestion();
}

/**
 * Displays the current question based on its type.
 * Updates question counter, type badge, and dynamically creates question elements.
 */
function showQuestion() {
    const question = questions[currentQuestion]; // 'questions' array is assumed to be defined in index.html
    document.getElementById('questionCounter').textContent = `Soalan ${currentQuestion + 1} dari ${questions.length}`;
    document.getElementById('questionText').textContent = question.question;

    // Set question type badge text
    const typeNames = {
        'multiple-choice': '🔘 Pilihan Berganda',
        'drag-drop': '🔄 Drag & Drop',
        'matching': '🔗 Matching',
        'fill-blank': '✏️ Fill in the Blank',
        'true-false': '✅ True/False'
    };
    document.getElementById('questionType').textContent = typeNames[question.type];

    // Clear previous question content
    const container = document.getElementById('questionContainer');
    container.innerHTML = '';

    // Reset Next button state for the new question
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.textContent = 'Semak Jawapan';
    nextBtn.onclick = checkAnswer; // Set click handler to checkAnswer
    nextBtn.disabled = true; // Disable until an answer is selected/entered

    // Dynamically create question content based on type
    switch (question.type) {
        case 'multiple-choice':
            createMultipleChoice(question, container);
            break;
        case 'drag-drop':
            createDragDrop(question, container);
            break;
        case 'matching':
            createMatching(question, container);
            break;
        case 'fill-blank':
            createFillBlank(question, container);
            break;
        case 'true-false':
            createTrueFalse(question, container);
            break;
    }

    // Update progress bar at the top
    const progress = (currentQuestion / questions.length) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
}

/**
 * Creates and appends multiple-choice options to the question container.
 * @param {Object} question - The current question object.
 * @param {HTMLElement} container - The HTML element to append options to.
 */
function createMultipleChoice(question, container) {
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options';

    question.options.forEach((optionText, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.textContent = optionText;
        optionDiv.onclick = function() {
            // Remove 'selected' class from all other options
            document.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected');
            });
            // Add 'selected' class to the clicked option
            this.classList.add('selected');
            selectedAnswer = index;          // Store the index of the selected option
            document.getElementById('nextBtn').disabled = false; // Enable the "Check Answer" button
        };
        optionsDiv.appendChild(optionDiv);
    });

    container.appendChild(optionsDiv);
}

/**
 * Creates and appends True/False options to the question container.
 * @param {Object} question - The current question object.
 * @param {HTMLElement} container - The HTML element to append options to.
 */
function createTrueFalse(question, container) {
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'options';

    ['Benar', 'Salah'].forEach((label, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.textContent = label;
        optionDiv.onclick = function() {
            // Remove 'selected' class from all other options
            document.querySelectorAll('.option').forEach(opt => {
                opt.classList.remove('selected');
            });
            // Add 'selected' class to the clicked option
            this.classList.add('selected');
            selectedAnswer = index;     // 0 = Benar, 1 = Salah
            document.getElementById('nextBtn').disabled = false; // Enable the "Check Answer" button
        };
        optionsDiv.appendChild(optionDiv);
    });

    container.appendChild(optionsDiv);
}

/**
 * Creates and appends drag-and-drop elements (drag items and drop zones) to the question container.
 * @param {Object} question - The current question object.
 * @param {HTMLElement} container - The HTML element to append elements to.
 */
function createDragDrop(question, container) {
    const dragContainer = document.createElement('div');
    dragContainer.className = 'drag-container';

    // Create section for draggable items
    const dragItemsDiv = document.createElement('div');
    dragItemsDiv.className = 'drag-items';
    dragItemsDiv.id = 'drag-items-container'; // Add an ID to easily reference

    const dragItemsTitle = document.createElement('h4');
    dragItemsTitle.textContent = 'Item untuk Drag';
    dragItemsDiv.appendChild(dragItemsTitle);

    question.dragItems.forEach((item, index) => {
        const dragItem = document.createElement('div');
        dragItem.className = 'drag-item';
        dragItem.textContent = item;
        dragItem.draggable = true; // Make the element draggable
        dragItem.id = 'drag-' + index; // Unique ID for each draggable item

        // Event listener for when dragging starts
        dragItem.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.id); // Store the ID of the dragged item
            this.classList.add('dragging'); // Add 'dragging' class for visual feedback
        });

        // Event listener for when dragging ends
        dragItem.addEventListener('dragend', function() {
            this.classList.remove('dragging'); // Remove 'dragging' class
        });

        dragItemsDiv.appendChild(dragItem);
    });

    // Create section for drop zones
    const dropZonesDiv = document.createElement('div');
    dropZonesDiv.className = 'drop-zones';

    const dropZonesTitle = document.createElement('h4');
    dropZonesTitle.textContent = 'Drop Zones';
    dropZonesDiv.appendChild(dropZonesTitle);

    question.dropZones.forEach((zone, index) => {
        const dropZone = document.createElement('div');
        dropZone.className = 'drop-zone';
        dropZone.id = 'drop-' + index; // Unique ID for each drop zone

        const zoneLabel = document.createElement('div');
        zoneLabel.className = 'drop-zone-label';
        zoneLabel.textContent = zone;
        dropZone.appendChild(zoneLabel);

        // Event listener for when a draggable item is dragged over a drop zone
        dropZone.addEventListener('dragover', function(e) {
            e.preventDefault(); // Prevent default to allow drop
            this.classList.add('drag-over'); // Add 'drag-over' class for visual feedback
        });

        // Event listener for when a draggable item leaves a drop zone
        dropZone.addEventListener('dragleave', function() {
            this.classList.remove('drag-over'); // Remove 'drag-over' class
        });

        // Event listener for when a draggable item is dropped on a drop zone
        dropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');

            const dragItemId = e.dataTransfer.getData('text/plain'); // Get the ID of the dragged item
            const dragItem = document.getElementById(dragItemId);

            // Append the dropped item to the current drop zone
            this.appendChild(dragItem);
            dragItem.classList.remove('dragging'); // Remove 'dragging' class

            // Update the stored answers for drag and drop
            updateDragDropAnswers();
            // Check if all necessary drop zones are filled to enable the next button
            checkDragDropComplete();
        });

        dropZonesDiv.appendChild(dropZone);
    });

    dragContainer.appendChild(dragItemsDiv);
    dragContainer.appendChild(dropZonesDiv);
    container.appendChild(dragContainer);

    // Initialize dragDropAnswers to an empty object for a new question
    dragDropAnswers = {};
}

/**
 * Updates the `dragDropAnswers` object based on the current state of drag and drop elements.
 * Maps drop zone indices to arrays of the indices of the drag items they contain.
 */
function updateDragDropAnswers() {
    const question = questions[currentQuestion];
    dragDropAnswers = {}; // Reset answers for current state

    // Initialize dragDropAnswers with empty arrays for each drop zone
    question.dropZones.forEach((_, zoneIndex) => {
        dragDropAnswers[zoneIndex] = [];
    });

    // Iterate through all drag items to see where they are placed
    question.dragItems.forEach((_, itemIndex) => {
        const dragItem = document.getElementById('drag-' + itemIndex);
        if (dragItem && dragItem.parentNode && dragItem.parentNode.classList.contains('drop-zone')) {
            const dropZoneId = dragItem.parentNode.id;
            const zoneIndex = parseInt(dropZoneId.split('-')[1]);
            dragDropAnswers[zoneIndex].push(itemIndex);
        }
    });
}

/**
 * Checks if all required drag and drop fields are filled to enable the "Check Answer" button.
 * For categorized questions, it ensures all drag items have been placed into a drop zone.
 */
function checkDragDropComplete() {
    const question = questions[currentQuestion];
    let complete = false;

    if (question.correctOrder) {
        // For ordered questions, all drop zones must be filled with exactly one item
        complete = Object.keys(dragDropAnswers).length === question.dropZones.length &&
                   Object.values(dragDropAnswers).every(arr => arr.length === 1);
    } else {
        // For categorized questions, all drag items must be placed into some drop zone
        const totalDroppedItems = Object.values(dragDropAnswers).flat().length;
        complete = totalDroppedItems === question.dragItems.length;
    }

    document.getElementById('nextBtn').disabled = !complete;
}

/**
 * Creates and appends matching columns (left and right items) to the question container.
 * Handles selection of items to form matches.
 * @param {Object} question - The current question object.
 * @param {HTMLElement} container - The HTML element to append elements to.
 */
function createMatching(question, container) {
    const matchingContainer = document.createElement('div');
    matchingContainer.className = 'matching-container';

    // Create left column for matching items
    const leftColumn = document.createElement('div');
    leftColumn.className = 'matching-column';

    const leftTitle = document.createElement('h4');
    leftTitle.textContent = 'Item';
    leftColumn.appendChild(leftTitle);

    question.leftItems.forEach((item, index) => {
        const matchingItem = document.createElement('div');
        matchingItem.className = 'matching-item';
        // Add a number prefix for better readability
        matchingItem.innerHTML = `<span class="item-number">${index + 1}.</span> ${item}`;
        matchingItem.dataset.index = index; // Store the original index for easy lookup
        matchingItem.dataset.column = 'left'; // Identify as a left column item

        // Event listener for clicking a left item
        matchingItem.addEventListener('click', function() {
            // Deselect any previously selected left item
            document.querySelectorAll('.matching-item[data-column="left"]').forEach(item => {
                item.classList.remove('selected');
            });

            // Select the current left item
            this.classList.add('selected');
            selectedLeftItem = parseInt(this.dataset.index); // Store the index of the selected left item
        });

        leftColumn.appendChild(matchingItem);
    });

    // Create right column for matching descriptions/answers
    const rightColumn = document.createElement('div');
    rightColumn.className = 'matching-column';

    const rightTitle = document.createElement('h4');
    rightTitle.textContent = 'Description';
    rightColumn.appendChild(rightTitle);

    question.rightItems.forEach((item, index) => {
        const matchingItem = document.createElement('div');
        matchingItem.className = 'matching-item';
        // Add a number prefix for better readability
        matchingItem.innerHTML = `<span class="item-number">${index + 1}.</span> ${item}`;
        matchingItem.dataset.index = index; // Store the original index for easy lookup
        matchingItem.dataset.column = 'right'; // Identify as a right column item

        // Event listener for clicking a right item
        matchingItem.addEventListener('click', function() {
            if (selectedLeftItem !== null) { // Only proceed if a left item is already selected
                const clickedRightIndex = parseInt(this.dataset.index);

                // Check if this right item is already matched with any left item
                const alreadyMatched = Object.values(matchingAnswers).includes(clickedRightIndex);

                if (!alreadyMatched) { // If it's not already matched
                    // Remove any existing match for the currently selected left item
                    if (matchingAnswers[selectedLeftItem] !== undefined) {
                        const prevRightIndex = matchingAnswers[selectedLeftItem];
                        // Remove 'matched' class and color from the previously matched right item
                        const prevRightItem = document.querySelector(`.matching-item[data-column="right"][data-index="${prevRightIndex}"]`);
                        if (prevRightItem) {
                            prevRightItem.classList.remove('matched', ...matchingColors);
                        }
                        // Remove 'matched' class and color from the previously matched left item
                        const prevLeftItem = document.querySelector(`.matching-item[data-column="left"][data-index="${selectedLeftItem}"]`);
                        if (prevLeftItem) {
                            prevLeftItem.classList.remove('matched', ...matchingColors);
                        }
                    }

                    // Create a new match: associate the selected left item with the clicked right item
                    matchingAnswers[selectedLeftItem] = clickedRightIndex;

                    // Apply a consistent color to the matched pair for visual grouping
                    const colorClass = matchingColors[(selectedLeftItem % matchingColors.length)];

                    // Add 'matched' class and the color class to both the left and right items
                    const leftItem = document.querySelector(`.matching-item[data-column="left"][data-index="${selectedLeftItem}"]`);
                    leftItem.classList.add('matched', colorClass);
                    this.classList.add('matched', colorClass);

                    // Deselect the left item after a match is made
                    selectedLeftItem = null;
                    document.querySelectorAll('.matching-item').forEach(item => {
                        item.classList.remove('selected'); // Remove 'selected' class from all items
                    });

                    // Check if all left items have been matched to enable the "Check Answer" button
                    checkMatchingComplete();
                }
            }
        });

        rightColumn.appendChild(matchingItem);
    });

    matchingContainer.appendChild(leftColumn);
    matchingContainer.appendChild(rightColumn);
    container.appendChild(matchingContainer);

    // Initialize matchingAnswers to an empty object for a new question
    matchingAnswers = {};
}


/**
 * Checks if all left items in a matching question have been assigned a match.
 * Enables/disables the "Check Answer" button accordingly.
 */
function checkMatchingComplete() {
    const question = questions[currentQuestion];
    // The button is enabled only if the number of matches equals the number of left items
    document.getElementById('nextBtn').disabled = Object.keys(matchingAnswers).length !== question.leftItems.length;
}

/**
 * Creates and appends fill-in-the-blank text with input fields to the question container.
 * Also includes an optional word bank.
 * @param {Object} question - The current question object.
 * @param {HTMLElement} container - The HTML element to append elements to.
 */
function createFillBlank(question, container) {
    const fillBlankContainer = document.createElement('div');
    fillBlankContainer.className = 'fill-blank-container';

    // Split the question text by the blank placeholder (_____)
    const parts = question.text.split(/(_____)/);
    // Initialize fillBlankAnswers array with empty strings, one for each blank
    fillBlankAnswers = new Array(question.blanks.length).fill('');

    parts.forEach((part, index) => {
        if (part === '_____') {
            const blankIndex = Math.floor(index / 2); // Calculate the index for the blank
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'blank-input';
            input.dataset.index = blankIndex; // Store the blank's index
            input.placeholder = 'Isikan jawapan';

            // Event listener for input changes to update answers and check completeness
            input.addEventListener('input', function() {
                fillBlankAnswers[this.dataset.index] = this.value.trim(); // Store trimmed input value
                checkFillBlankComplete(); // Check if all blanks are filled
            });

            fillBlankContainer.appendChild(input);
        } else {
            // Add static text parts
            const textSpan = document.createElement('span');
            textSpan.textContent = part;
            fillBlankContainer.appendChild(textSpan);
        }
    });

    // If a word bank is provided, create and append it
    if (question.wordBank) {
        const wordBankDiv = document.createElement('div');
        wordBankDiv.className = 'word-bank';

        const wordBankTitle = document.createElement('h4');
        wordBankTitle.textContent = 'Word Bank';
        wordBankDiv.appendChild(wordBankTitle);

        const wordOptionsDiv = document.createElement('div');
        wordOptionsDiv.className = 'word-options';

        question.wordBank.forEach((word, index) => {
            const wordOption = document.createElement('div');
            wordOption.className = 'word-option';
            wordOption.textContent = word;

            // Event listener for clicking a word from the word bank
            wordOption.addEventListener('click', function() {
                // Find the first empty blank input field
                const emptyBlankIndex = fillBlankAnswers.findIndex(answer => answer === '');
                if (emptyBlankIndex !== -1) {
                    // Fill the blank with the selected word
                    fillBlankAnswers[emptyBlankIndex] = word;

                    // Update the corresponding input field's value
                    const inputs = document.querySelectorAll('.blank-input');
                    inputs[emptyBlankIndex].value = word;

                    // Mark the word option as 'used' to prevent re-selection
                    this.classList.add('used');

                    checkFillBlankComplete(); // Check if all blanks are filled
                }
            });

            wordOptionsDiv.appendChild(wordOption);
        });

        wordBankDiv.appendChild(wordOptionsDiv);
        fillBlankContainer.appendChild(wordBankDiv);
    }

    container.appendChild(fillBlankContainer);
}

/**
 * Checks if all fill-in-the-blank input fields are filled.
 * Enables/disables the "Check Answer" button accordingly.
 */
function checkFillBlankComplete() {
    // The button is enabled only if no blank answers are empty strings
    document.getElementById('nextBtn').disabled = fillBlankAnswers.some(answer => answer === '');
}

/**
 * Checks the user's answer for the current question and updates the score.
 * Triggers highlighting of correct/incorrect answers and displays explanations.
 */
function checkAnswer() {
    const question = questions[currentQuestion];
    let isCorrect = false;

    // Logic to check answer based on question type
    switch (question.type) {
        case 'multiple-choice':
            isCorrect = (selectedAnswer === question.correct);
            highlightSelectedOption(isCorrect); // Visual feedback
            break;

        case 'true-false':
            // Convert boolean correct answer to an index (0 for True, 1 for False)
            const correctIndex = question.correct ? 0 : 1;
            isCorrect = (selectedAnswer === correctIndex);

            // Highlight chosen option
            const options = document.querySelectorAll('.option');
            options.forEach(opt => opt.classList.remove('selected', 'correct', 'incorrect')); // Clear previous states

            // Mark the user's chosen option as correct or incorrect
            options[selectedAnswer].classList.add(isCorrect ? 'correct' : 'incorrect');

            if (!isCorrect) {
                // If incorrect, also highlight the correct option
                options[correctIndex].classList.add('correct');
            }
            break;

        case 'drag-drop':
            if (question.correctOrder) {
                isCorrect = checkDragDropOrder(); // Check if items are in the correct sequence
            } else {
                isCorrect = checkDragDropCategories(); // Check if items are in the correct categories
            }
            highlightDragDrop(isCorrect); // Visual feedback
            break;

        case 'matching':
            isCorrect = checkMatchingPairs(); // Check if all matched pairs are correct
            highlightMatching(isCorrect); // Visual feedback
            break;

        case 'fill-blank':
            isCorrect = checkFillBlank(); // Check if all blanks are filled correctly
            highlightFillBlank(isCorrect); // Visual feedback
            break;
    }

    // Update overall score if the answer was correct
    if (isCorrect) {
        score++;
    }

    // Store user's answer and question details for result summary
    userAnswers[currentQuestion] = {
        question: question.question,
        userAnswer: getCurrentUserAnswer(), // Get formatted user answer
        correctAnswer: getCorrectAnswer(question), // Get formatted correct answer
        isCorrect: isCorrect,
        explanation: question.explanation // Include explanation
    };

    // Show the explanation for the current question
    showExplanation(question.explanation);

    // Change button text to "Next Question" or "View Results"
    const nextBtn = document.getElementById('nextBtn');
    nextBtn.textContent = currentQuestion < questions.length - 1 ? 'Soalan Seterusnya' : 'Lihat Keputusan';
    nextBtn.onclick = nextQuestion; // Change click handler to nextQuestion
    nextBtn.disabled = false; // Ensure button is enabled after checking
}

/**
 * Applies CSS classes to highlight the selected option (and correct option if incorrect)
 * for multiple-choice and true/false questions.
 * @param {boolean} isCorrect - True if the user's selection is correct, false otherwise.
 */
function highlightSelectedOption(isCorrect) {
    const options = document.querySelectorAll('.option');
    // Clear any previous highlighting
    options.forEach(option => option.classList.remove('selected', 'correct', 'incorrect'));

    if (selectedAnswer !== null) {
        const selectedOption = options[selectedAnswer];
        // Apply 'correct' or 'incorrect' class based on the answer
        selectedOption.classList.add(isCorrect ? 'correct' : 'incorrect');

        if (!isCorrect) {
            // If the user's answer was incorrect, also highlight the correct option
            const correctOption = options[questions[currentQuestion].correct];
            correctOption.classList.add('correct');
        }
    }
}

/**
 * Checks if the drag-and-drop items are in the correct order in their respective drop zones.
 * Applicable for questions with a defined `correctOrder`.
 * @returns {boolean} - True if all items are in the correct order, false otherwise.
 */
function checkDragDropOrder() {
    const question = questions[currentQuestion];
    let allCorrect = true;

    // Ensure all drop zones are filled with exactly one item
    if (Object.values(dragDropAnswers).flat().length !== question.dragItems.length ||
        Object.values(dragDropAnswers).some(arr => arr.length !== 1)) {
        return false; // Not all items placed correctly or some zones have multiple/none
    }

    // Iterate through each drop zone and compare its content with the correct order
    question.dropZones.forEach((zone, zoneIndex) => {
        const itemIndex = dragDropAnswers[zoneIndex][0]; // Get the single item in this zone
        if (itemIndex !== question.correctOrder[zoneIndex]) {
            allCorrect = false; // If any item is out of place, it's incorrect
        }
    });

    return allCorrect;
}

/**
 * Checks if the drag-and-drop items are assigned to the correct categories (drop zones).
 * Applicable for questions with a defined `correctAssignment`.
 * @returns {boolean} - True if all items are in their correct categories, false otherwise.
 */
function checkDragDropCategories() {
    const question = questions[currentQuestion];
    let allCorrect = true;

    // Check if every drag item is in its correct drop zone based on correctAssignment
    question.dragItems.forEach((_, itemIndex) => {
        const correctZoneIndex = question.correctAssignment[itemIndex];
        const currentZoneIndices = Object.keys(dragDropAnswers).filter(zoneIdx =>
            dragDropAnswers[zoneIdx].includes(itemIndex)
        ).map(Number); // Get the zone(s) where this item is currently located

        // An item should be in exactly one correct zone
        if (currentZoneIndices.length !== 1 || currentZoneIndices[0] !== correctZoneIndex) {
            allCorrect = false;
        }
    });

    return allCorrect;
}

/**
 * Applies CSS classes to highlight drag-and-drop items and zones as correct or incorrect.
 * Provides visual feedback including showing the correct placement for incorrect answers.
 * @param {boolean} isCorrect - True if the overall drag-and-drop answer is correct, false otherwise.
 */
function highlightDragDrop(isCorrect) {
    const question = questions[currentQuestion];

    // Clear all previous highlight classes
    document.querySelectorAll('.drop-zone').forEach(dz => {
        dz.classList.remove('correct', 'incorrect');
        // Remove any temporary correct clones
        dz.querySelectorAll('.drag-item[style*="opacity: 0.5"]').forEach(clone => clone.remove());
    });
    document.querySelectorAll('.drag-item').forEach(di => {
        di.classList.remove('correct', 'incorrect');
    });

    if (question.correctOrder) {
        // Logic for ordered drag-and-drop questions
        question.dropZones.forEach((zone, zoneIndex) => {
            const dropZone = document.getElementById('drop-' + zoneIndex);
            const droppedItemsInZone = dragDropAnswers[zoneIndex] || [];

            if (droppedItemsInZone.length === 1 && droppedItemsInZone[0] === question.correctOrder[zoneIndex]) {
                dropZone.classList.add('correct');
            } else {
                dropZone.classList.add('incorrect');

                // If incorrect, show the correct item in a faded way
                const correctItemIndex = question.correctOrder[zoneIndex];
                const correctItemOriginal = document.getElementById('drag-' + correctItemIndex);
                if (correctItemOriginal) {
                    const correctClone = correctItemOriginal.cloneNode(true);
                    correctClone.style.opacity = '0.5';
                    correctClone.style.borderStyle = 'dashed';
                    dropZone.appendChild(correctClone);
                }
            }
        });
    } else {
        // Logic for categorized drag-and-drop questions
        question.dragItems.forEach((_, itemIndex) => {
            const correctZoneIndex = question.correctAssignment[itemIndex];
            const currentZoneIndices = Object.keys(dragDropAnswers).filter(zoneIdx =>
                dragDropAnswers[zoneIdx].includes(itemIndex)
            ).map(Number);

            const dragItem = document.getElementById('drag-' + itemIndex);
            const parentDropZone = dragItem.parentNode;

            if (currentZoneIndices.length === 1 && currentZoneIndices[0] === correctZoneIndex) {
                // If the item is in the correct and only zone, mark its parent zone as correct
                if (parentDropZone && parentDropZone.classList.contains('drop-zone')) {
                    parentDropZone.classList.add('correct');
                }
            } else {
                // If incorrect, mark its parent zone as incorrect
                if (parentDropZone && parentDropZone.classList.contains('drop-zone')) {
                    parentDropZone.classList.add('incorrect');
                }
                // Show where the correct item should have been
                const correctDropZone = document.getElementById('drop-' + correctZoneIndex);
                if (correctDropZone) {
                    const correctClone = dragItem.cloneNode(true);
                    correctClone.style.opacity = '0.5';
                    correctClone.style.borderStyle = 'dashed';
                    correctDropZone.appendChild(correctClone);
                }
            }
        });
    }
}


/**
 * Checks if all matched pairs in a matching question are correct.
 * @returns {boolean} - True if all pairs are correctly matched, false otherwise.
 */
function checkMatchingPairs() {
    const question = questions[currentQuestion];
    let allCorrect = true;

    // Iterate through the correct matches and compare with user's answers
    question.correctMatches.forEach((correctRightIndex, leftIndex) => {
        if (matchingAnswers[leftIndex] !== correctRightIndex) {
            allCorrect = false; // If any pair is incorrect, the whole answer is incorrect
        }
    });

    return allCorrect;
}

/**
 * Applies CSS classes to highlight matching items as correct or incorrect.
 * Provides visual feedback for incorrect matches.
 * @param {boolean} isCorrect - True if the overall matching answer is correct, false otherwise.
 */
function highlightMatching(isCorrect) {
    const question = questions[currentQuestion];

    question.leftItems.forEach((item, leftIndex) => {
        const leftItem = document.querySelector(`.matching-item[data-column="left"][data-index="${leftIndex}"]`);
        const rightIndex = matchingAnswers[leftIndex]; // User's matched right item index

        if (rightIndex !== undefined) {
            const rightItem = document.querySelector(`.matching-item[data-column="right"][data-index="${rightIndex}"]`);

            if (rightIndex === question.correctMatches[leftIndex]) {
                // If the user's match is correct, apply 'correct-match' to both items
                leftItem.classList.add('correct-match');
                rightItem.classList.add('correct-match');
            } else {
                // If the user's match is incorrect, apply 'incorrect-match' to both
                leftItem.classList.add('incorrect-match');
                rightItem.classList.add('incorrect-match');

                // Optionally, briefly highlight the true correct match
                const correctRightIndex = question.correctMatches[leftIndex];
                const correctRightItem = document.querySelector(`.matching-item[data-column="right"][data-index="${correctRightIndex}"]`);

                if (correctRightItem) {
                    // Temporarily add a visual cue (e.g., box-shadow) to the correct answer
                    correctRightItem.style.boxShadow = '0 0 0 3px #28a745';
                    setTimeout(() => {
                        correctRightItem.style.boxShadow = ''; // Remove the cue after a delay
                    }, 2000);
                }
            }
        }
    });
}

/**
 * Checks if the fill-in-the-blank answers provided by the user are correct (case-insensitive).
 * @returns {boolean} - True if all blanks are filled correctly, false otherwise.
 */
function checkFillBlank() {
    const question = questions[currentQuestion];
    let allCorrect = true;

    question.blanks.forEach((blank, index) => {
        // Compare user's answer (trimmed and lowercased) with the correct answer (lowercased)
        if (fillBlankAnswers[index].toLowerCase() !== blank.toLowerCase()) {
            allCorrect = false; // If any blank is incorrect, the whole answer is incorrect
        }
    });

    return allCorrect;
}

/**
 * Applies CSS classes to highlight fill-in-the-blank input fields as correct or incorrect.
 * Temporarily shows the correct answer for incorrect inputs.
 * @param {boolean} isCorrect - True if the overall fill-in-the-blank answer is correct, false otherwise.
 */
function highlightFillBlank(isCorrect) {
    const inputs = document.querySelectorAll('.blank-input');

    inputs.forEach((input, index) => {
        const userAnswer = fillBlankAnswers[index].toLowerCase();
        const correctAnswer = questions[currentQuestion].blanks[index].toLowerCase();

        if (userAnswer === correctAnswer) {
            // If correct, mark the input as correct
            input.classList.add('correct');
        } else {
            // If incorrect, mark the input as incorrect
            input.classList.add('incorrect');

            // Temporarily display the correct answer in the input field
            const originalValue = input.value;
            input.value = questions[currentQuestion].blanks[index]; // Show correct answer
            input.style.color = '#28a745'; // Green text
            input.style.fontWeight = 'bold'; // Bold text

            // Revert the input field after a short delay
            setTimeout(() => {
                input.value = originalValue; // Restore user's input
                input.style.color = ''; // Remove color
                input.style.fontWeight = ''; // Remove bold
            }, 2000);
        }
    });
}

/**
 * Displays an explanation message below the question.
 * @param {string} text - The explanation text to display.
 */
function showExplanation(text) {
    const explanationDiv = document.createElement('div');
    explanationDiv.className = 'explanation';

    const explanationTitle = document.createElement('h4');
    explanationTitle.textContent = 'Penjelasan';
    explanationDiv.appendChild(explanationTitle);

    const explanationText = document.createElement('p');
    explanationText.textContent = text;
    explanationDiv.appendChild(explanationText);

    document.getElementById('questionContainer').appendChild(explanationDiv);
}

/**
 * Retrieves and formats the user's answer for the current question based on its type.
 * @returns {string} - A string representation of the user's answer.
 */
function getCurrentUserAnswer() {
    const question = questions[currentQuestion];

    switch (question.type) {
        case 'multiple-choice':
            return question.options[selectedAnswer];
        case 'true-false':
            return selectedAnswer === 0 ? 'True' : 'False';
        case 'drag-drop':
            if (question.correctOrder) {
                // For ordered drag and drop, show which item was in which zone
                return question.dropZones.map((zone, index) => {
                    const itemsInZone = dragDropAnswers[index] || [];
                    return `${zone}: ${itemsInZone.length > 0 ? question.dragItems[itemsInZone[0]] : 'Kosong'}`;
                }).join(', ');
            } else {
                // For categorized drag and drop, show which item was assigned to which category
                return Object.keys(dragDropAnswers).map(zoneIndex => {
                    const items = (dragDropAnswers[zoneIndex] || []).map(itemIdx => question.dragItems[itemIdx]);
                    return `${question.dropZones[zoneIndex]}: [${items.join(', ')}]`;
                }).join('; ');
            }
        case 'matching':
            // For matching, show user's pairs
            return question.leftItems.map((item, index) => {
                const rightIndex = matchingAnswers[index];
                return `${item} → ${rightIndex !== undefined ? question.rightItems[rightIndex] : 'Tidak dipadankan'}`;
            }).join(', ');
        case 'fill-blank':
            // For fill in the blank, show the filled words
            return fillBlankAnswers.join(', ');
        default:
            return 'N/A'; // Default case for unsupported types
    }
}

/**
 * Retrieves and formats the correct answer for the current question based on its type.
 * @returns {string} - A string representation of the correct answer.
 */
function getCorrectAnswer(question) {
    switch (question.type) {
        case 'multiple-choice':
            return question.options[question.correct];
        case 'true-false':
            return question.correct ? 'True' : 'False';
        case 'drag-drop':
            if (question.correctOrder) {
                // For ordered drag and drop, show the correct sequence
                return question.dropZones.map((zone, index) => {
                    return `${zone}: ${question.dragItems[question.correctOrder[index]]}`;
                }).join(', ');
            } else {
                // For categorized drag and drop, show the correct assignments for each item
                const correctCategoryMap = {};
                question.dragItems.forEach((item, itemIndex) => {
                    const correctZoneIndex = question.correctAssignment[itemIndex];
                    if (!correctCategoryMap[correctZoneIndex]) {
                        correctCategoryMap[correctZoneIndex] = [];
                    }
                    correctCategoryMap[correctZoneIndex].push(item);
                });

                return Object.keys(correctCategoryMap).map(zoneIndex => {
                    return `${question.dropZones[zoneIndex]}: [${correctCategoryMap[zoneIndex].join(', ')}]`;
                }).join('; ');
            }
        case 'matching':
            // For matching, show the correct pairs
            return question.leftItems.map((item, index) => {
                return `${item} → ${question.rightItems[question.correctMatches[index]]}`;
            }).join(', ');
        case 'fill-blank':
            // For fill in the blank, show the correct words
            return question.blanks.join(', ');
        default:
            return 'N/A';
    }
}

/**
 * Advances to the next question or shows the quiz results if all questions are answered.
 */
function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        // Reset state variables for the new question
        selectedAnswer = null;
        dragDropAnswers = {};
        matchingAnswers = {};
        fillBlankAnswers = [];
        selectedLeftItem = null;
        showQuestion(); // Display the next question
    } else {
        showResults(); // All questions answered, show results
    }
}

/**
 * Displays the final results screen after the quiz is completed.
 * Calculates and shows score, percentage, and feedback message.
 */
function showResults() {
    document.getElementById('questionScreen').style.display = 'none'; // Hide question screen
    document.getElementById('resultScreen').style.display = 'block'; // Show result screen

    // Set the user's name on the result screen
    displayUserNameSpan.textContent = userName;

    // Calculate overall percentage
    const percentage = Math.round((score / questions.length) * 100);

    // Update score display
    document.getElementById('finalScore').textContent = `${score}/${questions.length}`;
    document.getElementById('correctAnswers').textContent = score;
    document.getElementById('wrongAnswers').textContent = questions.length - score;
    document.getElementById('percentage').textContent = `${percentage}%`;

    // Set feedback message based on percentage
    const feedback = document.getElementById('feedbackMessage');
    if (percentage >= 90) {
        feedback.textContent = 'Tahniah! Anda sangat memahami konsep pemikiran komputasional!';
        feedback.className = 'feedback excellent'; // Apply excellent feedback style
    } else if (percentage >= 70) {
        feedback.textContent = 'Bagus! Anda memahami kebanyakan konsep tetapi ada ruang untuk penambahbaikan.';
        feedback.className = 'feedback good'; // Apply good feedback style
    } else {
        feedback.textContent = 'Anda perlu mengulangkaji beberapa konsep asas pemikiran komputasional.';
        feedback.className = 'feedback average'; // Apply average feedback style
    }

    // Ensure progress bar is full at the end
    document.getElementById('progressBar').style.width = '100%';
}

/**
 * Restarts the quiz from the beginning.
 * Hides the result screen and calls startQuiz to re-initialize.
 */
function restartQuiz() {
    document.getElementById('resultScreen').style.display = 'none'; // Hide result screen
    document.getElementById('startScreen').style.display = 'block'; // Show start screen
    userNameInput.value = ''; // Clear the name input
    startBtn.disabled = true; // Disable start button until name is entered again
    // Re-initialize quiz variables if needed, though startQuiz does this already
    // currentQuestion = 0;
    // score = 0;
    // userAnswers = [];
    // ... rest of reset
}
