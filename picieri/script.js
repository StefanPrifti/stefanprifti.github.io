
var app = angular.module('app', ['ngMap', 'angularMoment', 'ui.router']);
// app.js

app.config(function($stateProvider, $urlRouterProvider) {
    
    $urlRouterProvider.otherwise('/identifikohu');
    
    $stateProvider
        
        // HOME STATES AND NESTED VIEWS ========================================
        .state('home', {
            url: '/',
            templateUrl: 'partials/main.html',
        })
        
        // ABOUT PAGE AND MULTIPLE NAMED VIEWS =================================
        .state('identifikohu', {
            url: '/identifikohu',
            templateUrl: 'partials/identifikohu.html'    
        });

        // use the HTML5 History API
        //$locationProvider.html5Mode(true);
        
});


app.controller('mainData', function($scope, $http, $filter, $window, $location, $rootScope, $q) {

	console.log($scope.picieriToken);

	if (location.hash == "/")
		$location.path("/identifikohu");

	if ((typeof localStorage.getItem("picieriToken") === "undefined") || (localStorage.getItem("picieriToken") == null))
		$location.path("/identifikohu");
	else
		$location.path("/");

	$http.get("http://porosit-pica.herokuapp.com/api/getorderedpizzas", {token: $scope.picieriToken})
	.success(function (response) {
	    $scope.pizzaList = response;
	});


	$scope.distance = "?";
    $scope.listID = 0;
    $scope.selectedPizzaID = null;
    $scope.isSelected = false;
	$scope.pizzaDetails = {
		price : 0,
		diameter : 0,
		diameter_cm : 0,
		diameter_percent : 0,
		diameter_coeficient : 0
	};
	$scope.pizzaStatusArray = ["në pritje", "në gatim", "në pjekje", "në shpërndarje", "u dorëzua"];
	$scope.pizzaQuantityArray = ["fare", "pak", "normal", "ekstra", "dyfish"];

    $scope.setListID = function(id) {
		$scope.listID = id;
	}

	$scope.selectPizza = function(pizzaID) {
		$scope.selectedPizzaID = pizzaID;
		$scope.isSelected = true;
		$http.get("http://porosit-pica.herokuapp.com/api/getPizzaDetails/" + pizzaID, {token: $scope.picieriToken})
	    .success(function (response) {
	    	$scope.selectedPizza = response[0];

	    	setDiameterStats($scope.selectedPizza.diameter);

	    	$scope.pizzaDetails.price = 0;
		    angular.forEach($scope.selectedPizza.ingredients, function(i, index) {
				$scope.pizzaDetails.price += (i.quantity * i.ingredient.price);

				if (index == $scope.selectedPizza.ingredients.length - 1)
					$scope.pizzaDetails.price *= $scope.pizzaDetails.diameter_coeficient;
			});

		if ($scope.selectedPizzaDetails.orderCoords.latitude > 0) {
			$http.get("https://maps.googleapis.com/maps/api/distancematrix/json?origins=41.319155,19.793342&destinations=41.327583,%2019.808561&mode=driving&language=en-US&key=AIzaSyCEjAzac7pwBhe3L4bU3Ii5IPrP95bzE5E")
			.then(function (response) {
				console.log(response);

			}, function (response) {

			});
		}



	    });

	    angular.forEach($scope.pizzaList, function(pizza) {
	    	if( pizza.pizza_user_template._id ==  $scope.selectedPizzaID) {
	    		$scope.selectedPizzaDetails = pizza;
				$scope.status = $scope.pizzaStatusArray[$scope.selectedPizzaDetails.pizza_status];
	    	}
		});
	}

	function setDiameterStats (diameterNum) {
		switch(diameterNum){
			case 0:
				$scope.pizzaDetails.diameter_cm = 20;
				$scope.pizzaDetails.diameter_percent = 33.3;
				$scope.pizzaDetails.diameter_coeficient = 1;
				break;
			case 1:
				$scope.pizzaDetails.diameter_cm = 30;
				$scope.pizzaDetails.diameter_percent = 50;
				$scope.pizzaDetails.diameter_coeficient = 1.2;
				break;
			case 2:
				$scope.pizzaDetails.diameter_cm = 40;
				$scope.pizzaDetails.diameter_percent = 66.6;
				$scope.pizzaDetails.diameter_coeficient = 1.5;
				break;
			case 3:
				$scope.pizzaDetails.diameter_cm = 60;
				$scope.pizzaDetails.diameter_percent = 100;
				$scope.pizzaDetails.diameter_coeficient = 1.8;
				break;
		}
	}

	if (localStorage.getItem("picieriID") != null) 
	{
		$scope.picieriID = localStorage.getItem("picieriID");
		$scope.picieriToken = localStorage.getItem("picieriToken");
	}

	// console.log(localStorage.getItem("picieriID"));
	// console.log($scope.picieriID);

	$scope.logOut = function () {
		localStorage.removeItem("picieriID");
		localStorage.removeItem("picieriToken");

		$scope.picieriID = null;
		$scope.picieriToken = null;
		$location.path("/identifikohu");
	}

	$scope.logIn = function (u, p) {

		$http.post('http://porosit-pica.herokuapp.com/api/authenticatePizzaiolo', { email: u, password: p }).
		then(function(response) {

			$scope.user = response.data;
			console.log($scope.username);
			console.log(u);

			if (typeof response.data.id !== "undefined") {
				$scope.picieriID = response.data.id;
				$scope.picieriToken = response.data.token;
				localStorage.setItem("picieriID", response.data.id);
				localStorage.setItem("picieriToken", response.data.token);
				
				 console.log(response.data);

				 if (typeof response.data.id !== "undefined")
					$location.path("/");	
			}

		}, function(response) {
		    console.log("Deshtim, mbase me CORS " + response);
		});
	}



	$scope.setPizzaStatus = function (setStatus) {

		$http.post('http://porosit-pica.herokuapp.com/api/setpizzastatus', { userID: $scope.picieriID, pizzaID: $scope.selectedPizzaID, statusNum: setStatus }).
		then(function(response) {
			$q.all([
			    $http.get("http://porosit-pica.herokuapp.com/api/getorderedpizzas"),
			    $http.get("http://porosit-pica.herokuapp.com/api/getPizzaDetails/" + $scope.selectedPizzaID)
			]).then(function(values){
			    $scope.pizzaList = values[0].data;
			    $scope.selectedPizza = values[1].data[0];

			    angular.forEach($scope.pizzaList, function(pizza) {
			    	if( pizza.pizza_user_template._id ==  $scope.selectedPizzaID) {
			    		$scope.selectedPizzaDetails = pizza;
						$scope.status = $scope.pizzaStatusArray[$scope.selectedPizzaDetails.pizza_status];
			    	}
				});

				$scope.listID++;
			});

		}, function(response) {
	
		    console.log("Deshtim, mbase me CORS " + response);
		});
	}	

});