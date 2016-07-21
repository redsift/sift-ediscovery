/**
 * Taxi Sift. Frontend controller entry point.
 *
 * Copyright (c) 2016 Redsift Limited. All rights reserved.
 */

import { SiftController } from '@redsift/sift-sdk-web';

export default class TaxiController extends SiftController {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();

    // Fired whenever anything changes in the Sift's storage you can replace '*' by the name of a specific bucket
    this.storage.subscribe('*', this.onStorageUpdate.bind(this));

    // Subscribe to your custom events from the Sift view like so (to use class variables and functions don't
    // forget to bind the 'this' pointer!):
    this.subscribe('ncButton-pressed', this.onNCButtonPressed.bind(this));
  }

  // Function: loadView
  // Description: Invoked by the Redsift client when a Sift has transitioned to its final size class
  //
  // Parameters:
  // @state: {
  //          sizeClass: {
  //            previous: {width: 'compact'|'full', height: 'compact'|'full'},
  //            current:  {width: 'compact'|'full', height: 'compact'|'full'}
  //          },
  //          type: 'email-compose'|'email-thread'|'summary',
  //          params: {<object>}
  //        }
  //
  // return: {html:'<string>', data: {<object>|<Promise>}}
  loadView(state) {
    console.log('sift-ediscovery: loadView', value);
    /*
    * Replace example code with your sift logic
    */
    var height = value.sizeClass.current.height;
    return {html: 'view.html', data: fullAsyncHandler()};
  }

  // Function: loadData
  // Description: Invoked by the Sift view to load more data
  //
  // Parameters:
  // @value: <object>
  //
  // return: <object>
  // @resolve: function (<object>)
  // @reject: function (error)
  loadData(value) {
    console.log('sift-ediscovery: loadData', value);
    return this.storage.get({
      bucket: 'count',
      keys: [value.key]
    }).then((values) => {
      console.log('sift-ediscovery: storage returned: ', values);
      return values[0].value;
    });
  }

  // Event: storage update
  onStorageUpdate(value) {
    console.log('sift-ediscovery: storage updated: ', value);
    // Storage has been updated, fetch the new count
    this.storage.get({
      bucket: 'count',
      keys: ['TOTAL']
    }).then((values) => {
      console.log('sift-ediscovery: storage returned: ', values);
      this.publish('count', values[0].value);
    });
  }

  // Register for specific UI events
  onNCButtonPressed(value) {
    console.log('sift-ediscovery: ncButton-pressed received: ', value);
    this.storage.putUser({
      kvs: [{ key: 'NCBUTTONPRESSED', value: value }]
    }).then(() => {
      console.log('sift-ediscovery: stored in user database');
    }).catch((err) => {
      console.error('sift-ediscovery: error storing in user database', err);
    });
  }
}

function fullAsyncHandler() {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Asynchronous resolve
      resolve({
        html: 'view.html',
        data: {
          message: 'resolved asynchronously'
        }
      });
    }, 1500);
  });
}

/**
 * Sift Ediscovery. Client event handlers.
 */

// Event: emailread
// Description: Triggered when the user finishes reading an email
//
// Parameters:
// @event:
// {
//   threadID: the ID of the thread
//   time: time reading email (in ms)
// }
Redsift.Client.addEventListener('emailread', function (event) {
  console.log('sift-ediscovery: emailread: ', event);
});

// Event: emailsent
// Description: Triggered when the user finishes sending an email
//
// Parameters:
// @event:
// {
//   threadID: the ID of the thread
//   time: time writing email (in ms)
// }
Redsift.Client.addEventListener('emailsent', function (event) {
  console.log('sift-ediscovery: emailsent: ', event);
});

// Event: emaildiscarded
// Description: Triggered when the user discards an email that they were composing
//
// Parameters:
// @event:
// {
//   messageID: the ID of the message (as it was discarded, it is not part of a thread)
//   time: time writing email (in ms)
// }
Redsift.Client.addEventListener('emaildiscarded', function (event) {
  console.log('sift-ediscovery: emaildiscarded: ', event);
});

// Function: loadThreadListView
// Description: Invoked to allow the Sift to customise the presentation of a given thread list view
//
// Parameters:
// @listInfo: the object emitted by your dag into the _email.tid export bucket
// @supportedTemplates: the list of the templates supported by the invoking Redsift client
//
// @return: <object> containing one of the supported templates' information
Redsift.Client.loadThreadListView = function (listInfo, supportedTemplates) {
  console.log('sift-ediscovery: loadThreadListView: ', listInfo);
};
