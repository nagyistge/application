
'use strict';

/*
 *  Scenario 1:
 *
 *    Check that values for new columns are shown only for employess
 *    currently login user can supervise.
 *
 *    The reason for this sceanrio is because in UK for instance it is illegal to share
 *    details for employees who are not supervisers. Peers should not know how many days
 *    their coleagues were off sick for instance.
 *
 *    * create account by admin user A
 *    * add user B
 *    * add user C
 *    * ensure company has "Share absences between all employees" flag ON
 *    * make user B to be superviser of user C
 *    * login as user A and ensure team view shows deducted values for all three users
 *    * login as user B and ensure she sees deducted days only for user B (self) and user C
 *      but not for user A
 *    * login as user C and ensure she sees only values for her account
 *
 * */


/*
 *  Scenario 2:
 *
 *  Case when holidays spans through more then one month and is devided by bank holiday.
 *
 *    * create new account as admin user A
 *    * create user B
 *    * create new bank holiday to be on 2 Aug 2016
 *    * as user B create a holiday request from 28 July to morning of 4 Aug 2016 (a)
 *
 *    * as user B create a holiday request from 12 Aug to 15 Aug 2016 (b)
 *    * as user B create a holiday request from 26 Aug to 2 Sep 2016 (d)
 *    * as user B create a sick day request from 18 to 18 Aug 2016 (e)
 *    * as user A approve leaves (a), (b), (d), and (e)
 *    * as user B cretae a holiday request from 24 Aug to 24 Aug 2016 (c)
 *    * navigate to team view and ensure that it shows 9.5 days were deducted for Aug 2016
 *    * 2 days deducted for July 2016
 *    * 2 days deducted for Sept 2016
 *
 * */

var test                 = require('selenium-webdriver/testing'),
  By                     = require('selenium-webdriver').By,
  Promise                = require("bluebird"),
  expect                 = require('chai').expect,
  add_new_user_func      = require('../../lib/add_new_user'),
  check_elements_func    = require('../../lib/check_elements'),
  config                 = require('../../lib/config'),
  login_user_func        = require('../../lib/login_with_user'),
  logout_user_func       = require('../../lib/logout_user'),
  open_page_func         = require('../../lib/open_page'),
  register_new_user_func = require('../../lib/register_new_user'),
  submit_form_func       = require('../../lib/submit_form'),
  user_info_func         = require('../../lib/user_info'),
  new_bankholiday_form_id= '#add_new_bank_holiday_form',
  application_host       = config.get_application_host();

describe('Case when holidays spans through more then one month and is devided by bank holiday', function(){

  this.timeout( config.get_execution_timeout() );

  let driver,
    email_A, user_id_A,
    email_B, user_id_B;

  it("Register new company as admin user A", function(done){
    register_new_user_func({
      application_host : application_host,
    })
    .then(data => {
      driver  = data.driver;
      email_A = data.email;
      done();
    });
  });

  it("Create second user B", function(done){
    add_new_user_func({
      application_host : application_host,
      driver           : driver,
    })
    .then(data => {
      email_B = data.new_user_email;
      done();
    });
  });

  it("Obtain information about user A", function(done){
    user_info_func({
      driver : driver,
      email  : email_A,
    })
    .then(data => {
      user_id_A = data.user.id;
      done();
    });
  });

  it("Obtain information about user B", function(done){
    user_info_func({
      driver : driver,
      email  : email_B,
    })
    .then(data => {
      user_id_B = data.user.id;
      done();
    });
  });

  it("Open page with bank holidays", function(done){
    open_page_func({
      url    : application_host + 'settings/general/',
      driver : driver,
    })
    .then(function(){done()});
  })

  it("Create new bank holiday to be on 2 Aug 2016", function(done){
    driver.findElement(By.css('#add_new_bank_holiday_btn'))
      .then(el => el.click())
      .then(() => {

        // This is very important line when working with Bootstrap modals!
        driver.sleep(1000);

        submit_form_func({
          driver      : driver,
          form_params : [{
            selector : new_bankholiday_form_id+' input[name="name__new"]',
            value : 'Some summer holiday',
          },{
            selector : new_bankholiday_form_id+' input[name="date__new"]',
            value : '2016-08-02',
          }],
          submit_button_selector: new_bankholiday_form_id+' button[type="submit"]',
          message : /Changes to bank holidays were saved/,
        })
        .then(() => done());
      });
  });

  it("Logout from user A (admin)", function(done){
    logout_user_func({
      application_host : application_host,
      driver           : driver,
    })
    .then(() => done());
  });

  it("Login as user B", function(done){
    login_user_func({
      application_host : application_host,
      user_email       : email_B,
      driver           : driver,
    })
    .then(() => done());
  });

  it("Open Book leave popup window", function(done){
    driver.findElement(By.css('#book_time_off_btn'))
      .then( el => el.click() )
      // This is very important line when working with Bootstrap modals!
      .then( el => driver.sleep(1000) )
      .then(() => done());
  });

  it("As user B create a holiday request from 28 July to morning of 4 Aug 2016 (a)", function(done){
    submit_form_func({
      driver      : driver,
      form_params : [{
        selector        : 'select[name="from_date_part"]',
        option_selector : 'option[value="2"]',
        value           : "2",
      },{
        selector : 'input#from',
        value    : '2016-07-28',
      },{
        selector : 'input#to',
        value    : '2016-08-04',
      }],
      message : /New leave request was added/,
    })
    .then(function(){done()});
  });

  after(function(done){
    console.log('>>> ' + email_B);
    driver.quit().then(() => done());
  });
});