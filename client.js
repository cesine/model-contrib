// An Angular.js app that displays code examples.
//
// Curran Kelleher
// August 2014
var app = angular.module('exampleViewerApp', ['ngRoute']),

    // This JSON file is generated by `../devServer/buildExampleIndex.js`
    // and contains the data that drives this page.
    //
    // Structure is [ { name: String, files: [ String fileName ] } ]
    indexUrl = 'index.json',
    examplesPath = 'examples/';

app.config(function($routeProvider) {
  $routeProvider.
    when('/', {
      templateUrl: 'templates/home.html',
      controller: 'ExampleListCtrl'
    }).
    when('/examples/:exampleName', {
      templateUrl: 'templates/example.html',
      controller: 'ExampleDetailCtrl'
    }).
    when('/modules/:moduleName', {
      templateUrl: 'templates/module.html',
      controller: 'ModuleDetailCtrl'
    }).
    otherwise({
      redirectTo: '/'
    });
});

app.factory('index', function($http){

  function getData(callback){
    $http({
      method: 'GET',
      url: indexUrl,
      cache: true
    }).success(callback);
  }

  return {
    getIndex: function(callback){
      getData(function(data) {
        callback(data);
      });
    },
    findExample: function(name, callback){
      getData(function(data) {
        callback(_.findWhere(data.examples, { name: name }));
      });
    }
  };
});

app.controller('ExampleListCtrl', function ($scope, index){
  index.getIndex(function(index) {
    $scope.examples = index.examples;
    $scope.modules = index.modules;
  });
});

app.controller('ExampleDetailCtrl',
    function ($scope, $routeParams, $http, $sce, index){
  index.findExample($routeParams.exampleName, function(example) {
    $scope.example = example;
    $scope.runUrl = examplesPath + example.name;

    // Render the README.md file as HTML.
    $http.get($scope.runUrl + '/README.md').success(function(data) {
      $scope.readme = $sce.trustAsHtml(marked(data));
    });
  });
});

app.controller('ModuleDetailCtrl', function ($scope, $routeParams){
  $scope.docsUrl = 'docs/' + $routeParams.moduleName + '.html';
  $scope.moduleName = $routeParams.moduleName;
});

/**
 * The `file` directive loads the content of an 
 * example source code file into a CodeMirror instance
 * for syntax-highlighted presentation.
 */
app.directive('file', function(){
  return {
    scope: { file: '=', example: '=' },
    restrict: 'A',
    controller: function($scope, $http){
      var path = [
        examplesPath,
        $scope.example.name,
        $scope.file
      ].join('/');
      $http.get(path).success(function(data) {
        if(typeof(data) === 'object'){
          // un-parse auto-parsed JSON files for presentation as text
          data = JSON.stringify(data, null, 2);
        } else {
          // Remove trailing newlines from code presentation
          data = data.trim();
        }
        $scope.content = data;
      });
    },
    link : function(scope, element, attrs) {
      var textArea = element[0],
          ext = scope.file.substr(scope.file.lastIndexOf("."));
      var editor = CodeMirror.fromTextArea(textArea, {
        mode: {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.json': 'text/javascript',
          '.css': 'text/css'
        }[ext],
        lineNumbers: true,
        viewportMargin: Infinity
      });
      scope.$watch('content', function(data){
        if(data) {
          editor.setValue(data);
        }
      });
    }
  };
});
