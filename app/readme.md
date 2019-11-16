# Functional NodeJS web app

This is an NodeJS app that is written in functional way, aiming to use some concepts

## Running tests

Add how tests can be executed

### Wallaby.JS tests

Add description how WallabyJS can execute tests constantly

## Building app

what does it mean to "run" the app.

## Overall architecture

This is an Express app, running on NodeJS. Express provides routes which are initiated by the app.

The overall architecture follows Ports and Adapters architecture - i.e. Hexagonal Architecture pattern.

### Startup

App is responsible for building the object / function graph for the whole. Then using dependency injection to
e.g. provide adapters to the domain using Dependency Injection paradigms.

### Ports and Adapters

**Ports** include

**Domain** includes

**Adapters** includes

### Routes

The reason for existence for routes is to do couple of things
 * take parameter as given by HTTP request
 * validate parameters, but only the existence of a parameter
    * to fail on validation errors, if some parameter is missing
    * note that all validation errors should be reported!
 * and to pass blindly all parameters to DOMAIN
    * it is the responsibility of DOMAIN to define if parameters are valid for the query
 * to report the result of the DOMAIN action to the end user.

### Domain Actions

Domain actions take a list of parameters, validated that the required parameters exist,
and validate those using business rules.
