define([
    "angular",
    "./angularGrid"
], function(angular) {

    var gridsModule = angular.module("grids", ["angularGrid"]);

    gridsModule.controller('mainController', function($scope) {

        var colNames = ["Station","Railway","Street","Address","Toy","Soft Box","Make and Model","Longest Day","Shortest Night"];

        var countries = [
            {country: "Ireland", continent: "Europe", language: "English"},
            {country: "Spain", continent: "Europe", language: "Spanish"},
            {country: "United Kingdom", continent: "Europe", language: "English"},
            {country: "France", continent: "Europe", language: "French"},
            {country: "Germany", continent: "Europe", language: "(other)"},
            {country: "Sweden", continent: "Europe", language: "(other)"},
            {country: "Norway", continent: "Europe", language: "(other)"},
            {country: "Italy", continent: "Europe", language: "(other)"},
            {country: "Greece", continent: "Europe", language: "(other)"},
            {country: "Iceland", continent: "Europe", language: "(other)"},
            {country: "Portugal", continent: "Europe", language: "Portuguese"},
            {country: "Malta", continent: "Europe", language: "(other)"},
            {country: "Brazil", continent: "South America", language: "Portuguese"},
            {country: "Argentina", continent: "South America", language: "Spanish"},
            {country: "Colombia", continent: "South America", language: "Spanish"},
            {country: "Peru", continent: "South America", language: "Spanish"},
            {country: "Venezuela", continent: "South America", language: "Spanish"},
            {country: "Uruguay", continent: "South America", language: "Spanish"}
        ];

        var games = ["Chess","Cross and Circle game","Daldøs","Downfall","DVONN","Fanorona","Game of the Generals","Ghosts",
            "Abalone","Agon","Backgammon","Battleship","Blockade","Blood Bowl","Bul","Camelot","Checkers",
            "Go","Gipf","Guess Who?","Hare and Hounds","Hex","Hijara","Isola","Janggi (Korean Chess)","Le Jeu de la Guerre",
            "Patolli","Plateau","PÜNCT","Rithmomachy","Sáhkku","Senet","Shogi","Space Hulk","Stratego","Sugoroku",
            "Tâb","Tablut","Tantrix","Wari","Xiangqi (Chinese chess)","YINSH","ZÈRTZ","Kalah","Kamisado","Liu po",
            "Lost Cities","Mad Gab","Master Mind","Nine Men's Morris","Obsession","Othello"
        ];
        var booleanValues = [true, "true", false, "false", null, undefined, ""];

        var firstNames = ["Sophie","Isabelle","Emily","Olivia","Lily","Chloe","Isabella",
            "Amelia","Jessica","Sophia","Ava","Charlotte","Mia","Lucy","Grace","Ruby",
            "Ella","Evie","Freya","Isla","Poppy","Daisy","Layla"];
        var lastNames = ["Beckham","Black","Braxton","Brennan","Brock","Bryson","Cadwell",
            "Cage","Carson","Chandler","Cohen","Cole","Corbin","Dallas","Dalton","Dane",
            "Donovan","Easton","Fisher","Fletcher","Grady","Greyson","Griffin","Gunner",
            "Hayden","Hudson","Hunter","Jacoby","Jagger","Jaxon","Jett","Kade","Kane",
            "Keating","Keegan","Kingston","Kobe"];

        $scope.colCount = 20;
        $scope.rowCount = 1000;

        $scope.width = "100%";
        $scope.height = "100%";
        $scope.style = "ag-fresh";
        $scope.groupBy = "";

        $scope.angularGrid = {
            columnDefs: [],
            rowData: [],
            groupKeys: undefined, //set as string of keys eg ["region","country"],
            pinnedColumnCount: 0, //and integer, zero or more, default is 0
            rowHeight: 25, // defaults to 25, can be any integer
            enableColResize: true, //one of [true, false]
            enableSorting: true, //one of [true, false]
            enableFilter: true, //one of [true, false]
            rowSelection: "multiple", // one of ['single','multiple'], leave blank for no selection
            rowSelected: function(row) {console.log("Callback rowSelected: " + row); }, //callback when row selected
            selectionChanged: function() {console.log("Callback selectionChanged"); }, //callback when selection changed
            rowClicked: function(row, event) {console.log("Callback rowClicked: " + row + " - " + event);} //callback when row clicked
        };

        var defaultCols = [
            {displayName: "Name", field: "name", width: 200, cellCssFunc: nameCssFunc},
            {displayName: "Country", field: "country", width: 200, cellRenderer: countryCellRenderer, filterCellRenderer: countryFilterCellRenderer, filterCellHeight: 30},
            {displayName: "Language", field: "language", width: 200},
            {displayName: "Wanted Game", field: "game", width: 200},
            {displayName: "Bought", field: "bought", width: 100, cellRenderer: booleanCellRenderer, cellCss: {"text-align": "center"}, comparator: booleanComparator ,filterCellRenderer: booleanFilterCellRenderer},
            {displayName: "Quoted Price", field: "price", width: 100, cellRenderer: currencyRenderer, filterCellRenderer: currencyRenderer, cellCss: {"text-align": "right"}, cellCssFunc: currencyCssFunc}
        ];

        createCols();
        createData();

        $scope.onRowCountChanged = function() {
            createData();
            $scope.angularGrid.api.onNewRows();
        };

        $scope.onColCountChanged = function() {
            createCols();
            $scope.angularGrid.api.onNewCols();
        };

        $scope.onGroupByChanged = function() {
            var groupBy = null;
            if ($scope.groupBy!=="") {
                groupBy = $scope.groupBy.split(",");
            }
            $scope.angularGrid.groupKeys = groupBy;
            $scope.angularGrid.api.onNewRows();
        };

        function createCols() {
            var colCount = parseInt($scope.colCount);

            //start with a copy of the default cols
            var columns = defaultCols.slice(0);

            for (var col = defaultCols.length; col<colCount; col++) {
                var colName = colNames[col % colNames.length];
                var cellRenderer = undefined;
                var cellCss = undefined;
                var comparator = undefined;
                var filterCellRenderer = undefined;
                var cellCssFunc = undefined;
                var filterCellHeight = undefined;
                var colDef = {displayName: colName, field: "col"+col, width: 200,
                    cellRenderer: cellRenderer, filterCellRenderer: filterCellRenderer, filterCellHeight: filterCellHeight,
                    comparator: comparator, cellCss: cellCss, cellCssFunc: cellCssFunc};
                columns.push(colDef);
            }
            $scope.angularGrid.columnDefs = columns;
        }

        function createData() {
            var rowCount = parseInt($scope.rowCount);
            var colCount = parseInt($scope.colCount);
            var data = [];
            for (var row = 0; row<rowCount; row++) {
                var rowItem = {};

                //create data for the known columns
                var countryData = countries[row % countries.length];
                rowItem.country = countryData.country;
                rowItem.continent = countryData.continent;
                rowItem.language = countryData.language;

                var firstName = firstNames[row % firstNames.length];
                var lastName = lastNames[row % lastNames.length];
                rowItem.name = firstName + " " + lastName;

                rowItem.game = games[row % games.length];
                rowItem.price = ((Math.round(Math.random()*10000))/100) - 20;
                rowItem.bought = booleanValues[row % booleanValues.length];

                //create dummy data for the additional columns
                for (var col = defaultCols.length; col<colCount; col++) {
                    var value;
                    var randomBit = Math.random().toString().substring(2,5);
                    value = colNames[col % colNames.length]+"-"+randomBit +" - (" +row+","+col+")";
                    rowItem["col"+col] = value;
                }
                data.push(rowItem);
            }
            $scope.angularGrid.rowData = data;
        }

        //because name is the first col, if grouping present, we want to indent it.
        //this method is inside the controller as we access the scope
        function nameCssFunc(value) {
            var style = {};
            if ($scope.angularGrid.groupKeys) {
                switch ($scope.angularGrid.groupKeys.length) {
                    case 1 :
                        style["padding-left"] = "30px";
                        break;
                    case 2 :
                        style["padding-left"] = "40px";
                        break;
                }
            }
            return style;
        }

    });

    var COUNTRY_CODES = {
        Ireland: "ie",
        Spain: "es",
        "United Kingdom": "gb",
        France: "fr",
        Germany: "de",
        Sweden: "se",
        Italy: "is",
        Greece: "gr",
        Iceland: "is",
        Portugal: "pt",
        Malta: "mt",
        Norway: "no",
        Brazil: "br",
        Argentina: "ar",
        Colombia: "co",
        Peru: "pe",
        Venezuela: "ve",
        Uruguay: "uy"
    };

    function currencyCssFunc(value) {
        if (value!==null && value!==undefined && value<0) {
            return {"color": "red"};
        } else {
            return null;
        }
    }

    function currencyRenderer(value)  {
        if (value===null || value===undefined) {
            return null;
        } else {
            var decimalSeparator = Number("1.2").toLocaleString().substr(1,1);

            var amountWithCommas = value.toLocaleString();
            var arParts = String(amountWithCommas).split(decimalSeparator);
            var intPart = arParts[0];
            var decPart = (arParts.length > 1 ? arParts[1] : '');
            decPart = (decPart + '00').substr(0,2);

            return '&pound; ' + intPart + decimalSeparator + decPart;
        }
    }

    function booleanComparator(value1, value2) {
        var value1Cleaned = booleanCleaner(value1);
        var value2Cleaned = booleanCleaner(value2);
        var value1Ordinal = value1Cleaned===true ? 0 : (value1Cleaned===false ? 1 : 2);
        var value2Ordinal = value2Cleaned===true ? 0 : (value2Cleaned===false ? 1 : 2);
        return value1Ordinal - value2Ordinal;
    }

    function booleanCellRenderer(value) {
        var valueCleaned = booleanCleaner(value);
        if (valueCleaned===true) {
            //this is the unicode for tick character
            return "<span title='true'>&#10004;</span>";
        } else if (valueCleaned===false) {
            //this is the unicode for cross character
            return "<span title='false'>&#10006;</span>";
        } else {
            return null;
        }
    }

    function booleanFilterCellRenderer(value) {
        var valueCleaned = booleanCleaner(value);
        if (valueCleaned===true) {
            //this is the unicode for tick character
            return "&#10004;";
        } else if (valueCleaned===false) {
            //this is the unicode for cross character
            return "&#10006;";
        } else {
            return "(empty)";
        }
    }

    function booleanCleaner(value) {
        if (value==="true" || value===true || value===1) {
            return true;
        } else if (value==="false" || value===false || value===0) {
            return false;
        } else {
            return null;
        }
    }

    function countryCellRenderer(value) {
        //get flags from here: http://www.freeflagicons.com/
        if (value==="" || value===undefined || value===null) {
            return null;
        } else {
            var flag = "<img border='0' width='20' height='15' src='http://flags.fmcdn.net/data/flags/mini/"+COUNTRY_CODES[value]+".png'>";
            var link = "<a href='http://en.wikipedia.org/wiki/" + value + "' style='text-decoration: none;'> "+value+"</a>";
            var padding = 0;
            return "<span style='padding-left: "+padding+"px'>"+flag + link+"</span>";
        }
    }

    function countryFilterCellRenderer(value) {
        if (value==="" || value===undefined || value===null) {
            return "(no country)";
        } else {
            var flag = "<img border='0' width='20' height='15' src='http://flags.fmcdn.net/data/flags/mini/"+COUNTRY_CODES[value]+".png'>";
            return "<span style='font-weight: bold; font-size: 14px;'> " + flag + value + "</span>";
        }
    }

    angular.bootstrap(document, ['grids']);

});
