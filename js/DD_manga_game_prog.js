
// There's a bug for entries with identical titles (EX: manga -> light novel)
// For this and other reasons, see if we can tie choices to ID. Also, including signifier of media type may be good.
// There should be a way to do this with "value" as the id and with the text being title.


// To add:
// More stuff on victory screen (See if I can re-use fade-in animation here)
// Retry button
// Background (Something blue-ish? Need to contrast)
// More decoration (Custom slider and Title? Make it look nicer)
const backendAddress = "https://deltawdorko.pythonanywhere.com"

const answersPanel = document.getElementById('answers-panel');
const submitButton = document.getElementById('submitButton');
const countSlider = document.getElementById('countSlider')
const titleBox = document.getElementById('title-box');
const titleOptions = document.getElementById('titleOptions');
const englishCheckBox = document.getElementById('englishCheckBox');

let mangaCount = 100;
let titleList = new Array(mangaCount);
let enTitleList = new Array(mangaCount);
let idList = new Array(mangaCount);
let turnCount = 1;

const keyList = ["id", "title", "popularity", "mean_score", "num_volumes", "timeline", "shounen", "seinen", "shoujo", "josei", "kids"];
const quantKeyList = ["popularity", "mean_score", "num_volumes", "timeline"];
const closeRangeList = [10, 0.25, 5, 5];

let getData = fetch(backendAddress + '/titles')
    .then((response) => {
        if(response.ok){
            return response.json();
        } else {
            throw new Error(`Response status: ${response.status}`);
        }
    })
    .then((data) => {
        
        for(let i = 1; i <= Number(countSlider.max); i++) {
            idList[i - 1] = data[i]["id"];
            titleList[i - 1] = data[i]["title"];
            enTitleList[i - 1] = data[i]["en"]
            let option = document.createElement('option');
            if(i >= mangaCount) {continue;}
            
            if(englishCheckBox.checked && data[i]["en"].slice(0,2) != " (") {
                option.value = data[i]["en"];
            } else {
                option.value = data[i]["title"];
            }
            titleOptions.appendChild(option);
        }   
        return;
    })
    .catch((error) => {
        console.error(error);
    });


let solutionId = 0;
let solutionDict = {};
let solutionDemos = new Set();


async function startGame() {
    solutionId = idList[Math.ceil(Math.random() * mangaCount)];
    solutionDict = await Promise.resolve(getSingle(solutionId));
    solutionDemos = demoSet(solutionDict);

    while(answersPanel.hasChildNodes()) {
        answersPanel.removeChild(answersPanel.firstChild);
    }
}

submitButton.addEventListener("click", async function() {

    if(idList[mangaCount - 1] == undefined) {
        await getData;
    }

    if(turnCount == 1) {
        await startGame();
    } else {
        answersPanel.firstChild.classList.remove('flip-up-class');
    }

    let answersList = answersPanel.children;
    
    for(i = 0; i < answersList.length; i++) {
        answersList[i].classList.add('shift-down-class');
    }


    let currSelectionTitle = titleBox.value;
    let currSelectionId = 0;

    let currAnswerBox = document.createElement('div');
    currAnswerBox.className = "answers-box";
    let turnCounter = document.createElement('turn-counter');
    turnCounter.textContent = turnCount
    currAnswerBox.append(turnCounter);

    turnCount += 1;
    
    if(englishCheckBox.checked && enTitleList.includes(currSelectionTitle)) {
        currSelectionId = idList[enTitleList.indexOf(currSelectionTitle)];
    } else {
        currSelectionId = idList[titleList.indexOf(currSelectionTitle)];
    }

    let currDict = await Promise.resolve(getSingle(currSelectionId));

    let nameCat = document.createElement('div');
    nameCat.className = "answers-category";
    nameCat.textContent = currSelectionTitle

    // Try and make this a function so I can use it for fails? May need to handle async differently.
    if(currSelectionId == solutionId) {
        nameCat.classList.add("correct");
        turnCount = 1;
        endGame();
    }

    currAnswerBox.appendChild(nameCat);

    for(i = 0; i < quantKeyList.length; i++) {
        createComparePanel(quantKeyList[i], closeRangeList[i]);
    }


    let demoCat = document.createElement('div');
    demoCat.className = "answers-category";
    let currDemos = demoSet(currDict);
    let demoText = "";

    if(currDemos.isSubsetOf(solutionDemos) && solutionDemos.isSubsetOf(currDemos)) {
        demoCat.classList.add("correct");
    } else if(solutionDemos.intersection(currDemos).size > 0) {
        demoCat.classList.add("close");
    }

    for(const value of currDemos) {
        demoText += String(value) + ", ";
    }

    if(demoText.length == 0) {
        demoCat.textContent = "demographics: None";
    } else {
        demoCat.textContent = "demographics: " + demoText.slice(0, -2);
    }

    currAnswerBox.style.height = nameCat.style.height
    currAnswerBox.appendChild(demoCat);
    answersPanel.prepend(currAnswerBox);
    currAnswerBox.classList.add('flip-up-class');

    for(i = 0; i < answersList.length; i++) {
        answersList[i].classList.remove('shift-down-class');
    }


    function createComparePanel(key, closeRange) {
        let solutionVal = solutionDict[key];
        let currVal = currDict[key];

        let answerCat = document.createElement('element');
        let answerText = document.createElement('element');
        answerText.classList.add('category-text');
        let compareArrow = document.createElement('div');
        answerCat.className = "answers-category";
        /*
        This is just for presentation. The Popularity one is since a lower number 
        represents "higher" popularity. Therefore, I reverse the arrow.
        */
        let descriptor = "Category"
        switch(key) {
            case "num_volumes":
                descriptor = "volumes: ";
                break;
            case "mean_score":
                descriptor = "mean score: ";
                break;
            case "timeline":
                descriptor = "start year: ";
                break;
            case "popularity":
                compareArrow.style.transform = "rotate(180deg)";
            default:
                descriptor = key + ": ";
        }

        if(currVal == solutionVal) {
            answerCat.classList.add("correct");
            answerCat.textContent = descriptor + String(currVal);
            currAnswerBox.appendChild(answerCat);
            return;
        } else if(currVal > solutionVal) {
            compareArrow.classList.add("triangle-down");
        } else {
            compareArrow.classList.add("triangle-up");
        }

        if(Math.abs(currVal - solutionVal) <= closeRange) {
            answerCat.classList.add("close");
        }

        currAnswerBox.appendChild(answerCat);
        answerCat.appendChild(compareArrow);
        answerText.textContent = descriptor + String(currVal);
        answerCat.appendChild(answerText);
    }
})

function getSingle(idNum) {
    return fetch(backendAddress + '/info,id=' + String(idNum))
    .then((response) => {
        if(response.ok){
            return response.json()
        } else {
            throw new Error(`Response status: ${response.status} for idNum` + String(idNum));
        }
    })
    .catch((error) => {
        console.error(error)
    });
}

function demoSet(inDict) {
    finalSet = new Set();
    
    if(inDict["shounen"] == 1) {finalSet.add("shounen")}
    if(inDict["seinen"] == 1) {finalSet.add("seinen")}
    if(inDict["shoujo"] == 1) {finalSet.add("shoujo")}
    if(inDict["josei"] == 1) {finalSet.add("josei")}
    if(inDict["kids"] == 1) {finalSet.add("kids")}

    return finalSet;
}

async function endGame() {

    imageLink = fetch(backendAddress + '/picture,id=' + String(solutionDict["id"]))
    .then((response) => {
        if(response.ok) {
            return response.json()
        } else {
            throw new Error(`Response status: ${response.status} for idNum` + String(solutionDict["id"]));
        }
    })
    .catch((error) => {
        console.error(error)
    });

    let solutionImage = document.createElement('img', 'src=');
    solutionImage.src = String((await Promise.resolve(imageLink))["value"])
    solutionImage.classList.add('end-img')
    let overlay = document.createElement('element');
    overlay.id = 'overlay';
    overlay.classList.add('on');
    document.body.appendChild(overlay);
    overlay.appendChild(solutionImage);
    // Add Title
    // Add Retry Button
}

countSlider.addEventListener("change", function() {changeTitleList(false)});
englishCheckBox.addEventListener("change", function() {changeTitleList(true)});

function changeTitleList(checkBox) {
    let newCount = countSlider.value;
    
    if(checkBox) {
        while(titleOptions.children.length != 0) {
            titleOptions.removeChild(titleOptions.lastChild)
        }
        mangaCount = 0
    }

    if(newCount > mangaCount) {
        for(let i = mangaCount; i < newCount; i++) {
            let option = document.createElement('option');
            if(englishCheckBox.checked && enTitleList[i] != undefined) {
                option.value = enTitleList[i];
            } else {
                option.value = titleList[i];
            }
            titleOptions.appendChild(option);
        }
    } else {
        for(let i = mangaCount - 1; i >= newCount; i--) {
            titleOptions.removeChild(titleOptions.lastChild);
        }
    }

    mangaCount = newCount;
    sliderValue = document.getElementById("sliderValue");
    sliderValue.textContent = newCount;
}
