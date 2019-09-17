+# Tidsapp av Happy Surfers

## Installtion

### Prerequisites
* NodeJS
* MySQL

1. Import the database `mysql -u username -p < database.sql`
2. Install all NPM dependencies `npm install`
3. Start it and then stop it `sudo node index.js`
4. Configure mysql and web-port `config.json`
5. Done!

## Systembeskrivning

```javascript
/**
 * Check in a user from via their user id 
 * @param user_id Int ID of the user(time:users:id)
 * @param check_in Boolean Overwrites and checks in the user if it's true. If this valus is not definied the user will be toggled
 */
check_in(user_id, check_in = null, project_name = null)


/**
 * If the user is checked in
 * @param user_id int ID of the user.
 * @returns Boolean returns true if the user is checked in
 */
is_checked_in(user_id)


/**
 * Get user via their ID
 * If the user ID is invalid, return false
 * @param user_id Int ID of the user(time:users:id)
 */
get_user(user_id)


/**
 * Get user via their token
 * If the token is invalid, return false
 * @param token String The users token
 */
get_user_from_token(token)


/**
 * Create a new project
 * Provided project name and owner
 * @param project_name String Choosen name of the new project
 * @param user User User that did the change
 */
create_project(project_name, user)


/**
 * Get an entire project from the database
 * This inlcudes the project name and id
 * @param project_name Name of the project
 */
get_project(project_name)


/**
 * Edit the name of a project
 * @param project_name Old name of the project
 * @param new_project_name New name of the project
 * @param user The user who requested the change
 */
edit_project_name(project_name, new_project_name, user)


/**
 * Deletes the projekt specified
 * @param project_name The name of the project that is being deleted
 * @param user User that deleted the project for logs
 * 
 */
delete_project(project_name, user)


/**
 * Add a new user to the project specified in project name
 * @param user_to_add The target user to add 
 * @param project_name The target project to add the user to
 * @param user User that did the change for logs
 */
add_user(user_to_add, project_name, user)


/**
 * Remove user from project 
 * @param user_to_remove The user to be removed
 * @param project_name The project that the user will be removed from
 * @param user The user that removes the other user
 * 
 */
remove_user(user_to_remove, project_name, user)


/**
 * Log in function
 * @param username is the username
 * @param password is the password
 * 
 */
login_user(username, password)































```
-











## REST API
Documentation https://github.com/te4umea2019/Tidsapp-HS/wiki

## Slack / kommandon `<required> [optional]`

    /checkin [project name]
        Checking in to presence
        Checking in to presence and the project, if project name is provided
        Can be used to check out of a project and only in to presence if no project name is provided
        
    /checkout
        Check out of project and presence

    /new <name>
        Creates a new project with the name provided
        Also generates a new color associated with the project.

    /project <project name>
        Get information about the project, how many hours you have worked (today, this week, all time)

    /add <username> <project> 
        Add another user to one of your projects
        
    /remove <username> <project> 


## Diagram
![](img/diagram.png)


## MySQL tables

**Important: When storing the date, store it in ms since epoch, ```Date.now()```**

#### Users
name | type | special | description
--- | --- | --- | ---
id | int | AUTO_INCREMENT, PRI | ID of the user
username | text |none | User choosen name
name | text | none | Full name of the user
avatar | text | none | Link of the username
email | text | none | Email of the user
access_token | text | none | Access token given by slack, used to update user information
admin | int | none | Boolean(0-1) if the user is an admin or not.
created | BigInt | none | The date the user was created

#### Checks
name | type | special | description
--- | --- | --- | ---
id | int | AUTO_INCREMENT, PRI | ID of the check
user | id |none | ID of the user
check_in | int | none | Boolean(0-1) if the it was a check in (otherwise check out)
project | text | NULL | Name of the project
date | BigInt | none | Date of the
type | text | none | Check in type (web, card, TOP SECRET)

#### Tokens

name | type | special | description
--- | --- | --- | ---
id | int | AUTO_INCREMENT, PRI | ID of the token
user | id |none | ID of the user
token | text | none | Token

#### Projects

name | type | special | description
--- | --- | --- | ---
id | int | AUTO_INCREMENT, PRI | ID of the project
name | text | none | Name of the project

#### Joints (table name subject to change ??)
List of who has joined what team and how much work they have done (in hours / minutes)

name | type | special | description
--- | --- | --- | ---
id | int | AUTO_INCREMENT, PRI | ID of the joint
project | text | none | Name of the project
user | int | none | ID of the user
work | BigInt | none | Work done in ms (1 hour of work = 3600000)
date | BigInt | none | Date of joining the project
