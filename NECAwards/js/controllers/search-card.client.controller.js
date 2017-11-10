let $searchCardFront;
let $searchCardBack;

function initSearchCard() {
    $searchCardFront = $(".front.search");
    $searchCardBack = $(".back.search");

    $('.SEARCH_FLOW_INACTIVE').click(() => {
        CARD_MANAGER.getSearchCard().pushFlowPath(1);
        updateHTMLCard_Search();
    });

    $(".closeButton").click(() => {
        CARD_MANAGER.getSearchCard().popAllFlowPath();
        flipAllCards();
        updateHTMLCard_Search();
    });

    $(".SEARCH_FLOW_SEARCH_OPTIONS > div.searchBackNavButton").click(() => {
        CARD_MANAGER.getSearchCard().popFlowPath();
        flipAllCards();
        updateHTMLCard_Search();
    });

    $(".searchOption").click(function(e) {
        let $newOption = $(e.currentTarget);
        let searchType = $newOption.find(".searchOptionText").text();
        let searchCard = CARD_MANAGER.getSearchCard();
        switch(searchType) {
            case "NAME":
                searchCard.searchType = searchType;
                searchCard.pushFlowPath([2, 3]);
                break;
            case "YEAR":
                searchCard.searchType = searchType;
                searchCard.pushFlowPath([2, 0]);
                break;
            case "DISCIPLINE":
                searchCard.searchType = searchType;
                searchCard.pushFlowPath([2, 1]);
                break;
            case "AWARD":
                searchCard.searchType = searchType;
                searchCard.pushFlowPath([2, 2]);
                break;
            default:
            // DO NOTHING
        }
        updateHTMLCard_Search();
    });

    $(".os-only").click(function() {
        let $toggle = $(".os-only");
        let searchCard = CARD_MANAGER.getSearchCard();

        if ($toggle.hasClass("active")) {
            $toggle.find('i').toggleClass("fa-circle-o  fa-check-circle-o");
            $toggle.removeClass("active");
            searchCard.outstanding = false;
        } else {
            $toggle.find('i').toggleClass("fa-check-circle-o fa-circle-o");
            $toggle.addClass("active");
            searchCard.outstanding = true;
        }
    });

    const onKeyClick = function(e) {
        let $k = $(e.currentTarget);
        let kChar = $k.text();
        if (kChar === '⎵') {
            kChar = " ";
        }

        let $field = $(".searchField");
        let fieldText = $field.val();
        $field.val(fieldText + kChar);
    };
    $(".zRow > span").click(onKeyClick);
    $(".aRow > span").click(onKeyClick);
    $(".qRow > span").click(onKeyClick);
    $(".numberKeys > span").click(onKeyClick);

    $(".backspace").click(() => {
        let $field = $(".searchField");
        let fieldText = $field.val();
        $field.val(fieldText.substring(0, fieldText.length - 1));
    });

    $(".searchButton").click(function() {
        (async function doThis() {
            let searchCard = CARD_MANAGER.getSearchCard();

            let body = {
                "type": searchCard.searchType,
                "keyword": $(".searchField").val(),
                "outstanding": searchCard.outstanding
            };

            try {
                const response = await postSearch(body);
                let data = response.data;
                if (data) {
                    console.log("Got search results: " + data);
                    let searchResults = data;

                    idleActivationTimer.setShortTimerEnabled(false);

                    if (_.isEmpty(searchResults)) {
                        CARD_MANAGER.replaceAllWithOnly([]);
                        searchCard.pages = 1;
                    } else if (_.has(searchResults, '0')) {
                        CARD_MANAGER.replaceAllWithOnly(searchResults["0"]);
                        searchCard.pushFlowPath(3);
                        searchCard.searchResults = searchResults;
                    }
                    searchCard.pageIdx = 0;
                } else {
                    console.log("Did not get a result!");
                }
            } catch(err) {
                console.log(err);
                // Set nothing on screen.
                idleActivationTimer.setShortTimerEnabled(false);
                CARD_MANAGER.replaceAllWithOnly([]);
            }

            // let flowPath = CARD_MANAGER.getSearchCard().flowPath;
            // CARD_MANAGER.getSearchCard().flowPath = flowPath.push(0);

            updateHTMLCard_Search();
        })();
    });

    $(".searchBackNavButton").click(() => {
        CARD_MANAGER.getSearchCard().popFlowPath();
        updateHTMLCard_Search()
    });
}

function updateHTMLCard_Search() {
    let state = CARD_MANAGER.getSearchCardState();
    $searchCardFront.children().hide();

    // Reset input field
    let $field = $(".searchField");
    $field.val("");

    // Reset outstanding to false
    let $os = $(".os-only");
    $os.removeClass("active");
    $os.find('i').addClass("fa-circle-o");
    $os.find('i').removeClass("fa-check-circle-o");
    let searchCard = CARD_MANAGER.getSearchCard();
    searchCard.outstanding = false;

    if (SEARCH_FLOW_INACTIVE === state) {
        $(".search").removeClass("active");
    } else {
        $(".search").addClass("active");
    }

    if (SEARCH_FLOW_INPUT_YEAR === state) {
        $searchCardFront.find("." + SEARCH_FLOW_INPUT_YEAR).show();
    } else if (SEARCH_FLOW_INPUT_ALUM === state
        || SEARCH_FLOW_INPUT_AWARD === state
        || SEARCH_FLOW_INPUT_DISCIPLINE === state) {
        $searchCardFront.find(".SEARCH_FLOW_INPUT_ALPHA").show();
    } else if (SEARCH_FLOW_RESULT_PAGES === state) {
        let $pageWrapper = $searchCardFront.find(".page-numbers-wrapper");

        $pageWrapper.empty();

        let numPages = Object.keys(searchCard.searchResults).length;
        let onPage = searchCard.pageIdx;
        for (let i = 0; i < numPages; ++i) {
            if (onPage === i) {
                $pageWrapper.append(`<span class="bold">${i + 1}</span>`);
            } else {
                $pageWrapper.append(`<span class="lower-focus activatable">${i + 1}</span>`);
            }
        }
        attachPageButtonListeners();
        $searchCardFront.find("." + state).show();
    } else {
        $searchCardFront.find("." + state).show();
    }
}

function attachPageButtonListeners() {
    let $pageWrapper = $searchCardFront.find(".page-numbers-wrapper");

    $pageWrapper.find("span").click(function() {
        if ($(this).hasClass("activatable")) {
            const pageIdx = (parseInt($(this).text()) - 1);
            const searchCard = CARD_MANAGER.getSearchCard();
            CARD_MANAGER.replaceAllWithOnly(
                searchCard.searchResults[pageIdx + ""]);
            searchCard.pageIdx = pageIdx;
            updateHTMLCard_Search();
        }
    });
}
