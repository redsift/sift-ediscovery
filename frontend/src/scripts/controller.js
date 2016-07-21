/**
 * sift-taxi: frontend controller entry point.
 *
 * Copyright (c) 2016 Redsift Limited. All rights reserved.
 */

import { SiftController, registerSiftController } from '@redsift/sift-sdk-web';
import Webhook from './lib/webhook';
import moment from 'moment/moment';

export default class TaxiController extends SiftController {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();

    this._sizeClass = null;
    this._currency = 'GBP';
    this._detail = null;

    this.highlightIndexes = {
      uber: 1,
      hailo: 3,
      addisonlee: 5
    };

    // This is how you subscribe to the storage  (to use class variables and functions don't
    // forget to bind the 'this' pointer!):
    this.storage.subscribe(['year', 'month', 'day'], this.onStorageUpdate.bind(this));
    // Subscribe to your custom events from the Sift view like so (to use class variables and functions don't
    // forget to bind the 'this' pointer!):
    this.view.subscribe('currency', this.onCurrencyChange.bind(this));
  }

  // Function: loadView
  // Description: Invoked when a Sift has transitioned to a final size class or when its storage has been updated
  // Parameters:
  // @value: {
  //          sizeClass: {
  //            previous: {width: 'small'|'medium'|'full', height: 'medium'|'full'},
  //            current:  {width: 'small'|'medium'|'full', height: 'medium'|'full'}
  //          },
  //          type: 'email-compose'|'email-detail'|'summary',
  //          params: {<object>}
  //        }
  // return: null or {html:'<string>', data: {<object>}}
  // @resolve: function ({html:'<string>', data: {<object>})
  // @reject: function (error)
  loadView(state) {
    console.log('sift-taxi: loadView', state);
    this._sizeClass = state.sizeClass.current;
    if (state.params && state.params.detail) {
      this._detail = state.params.detail;
    }
    var data = this.storage.getUser({ keys: ['currency']}).then((results) => {
      if (results && results[0] && results[0].value) {
        this._currency = results[0].value;
      }
      return this.getData(this._detail);
    });
    return {html: 'view.html', data: data};
  }

  onStorageUpdate(value) {
    console.log('sift-taxi: onStorageUpdate: ', value);
    this.getData(this._detail).then((data) => {
      this.publish('storageupdate', data);
    });
  }

  onCurrencyChange(value) {
    console.log('sift-taxi: onCurrencyChange: ', value);
    this.storage.get({ bucket: '_redsift', keys: ['webhooks/settings-wh'] }).then((result) => {
      console.log('sift-taxi: onCurrencyChange webhook url: ', result[0].value);
      this._currency = value;
      this.storage.putUser({ kvs: [{ key: 'currency', value: value }] });
      var wh = new Webhook(result[0].value);
      wh.send('currency', value);
    }).catch((error) => {
      console.error('sift-taxi: onCurrencyChange: ', error);
    });
  }

  getData(details) {
    console.log('sift-taxi: getData: ', details);
    var ps = [];
    ps.push(this._getMonthData(details));
    ps.push(this._getYTDData());
    ps.push(this._getTodayData());
    return Promise.all(ps).then((results) => {
      console.log('sift-taxi: getData: resolved: ', results);
      var ret = results[0];
      if(results[1].value) {
        ret.stats.ytd = JSON.parse(results[1].value).total;
      }
      if(results[2].value) {
        ret.stats.today = JSON.parse(results[1].value).total;
      }
      ret.currency = this._currency;
      return ret;
    });
  }

  _getTodayData() {
    return this.storage.get({
      bucket: 'day',
      keys: [moment().utc().valueOf().toString()]
    });
  }

  _getYTDData() {
    return this.storage.get({
      bucket: 'year',
      keys: ['' + moment().year()]
    });
  }

  _getMonthData(details) {
    var cKeys = this._getChartKeys(this._sizeClass.width, details);
    return this.storage.get({ bucket: 'month', keys: cKeys }).then((results) => {
      console.log('sift-taxi: _getMonthData got: ', results);
      var stats = { trips: 0, total: 0, average: 0 };
      var pt = [0.0, 0.0, 0.0];
      var lines = results.map((r) => {
        var k = parseInt(r.key);
        var ms = {l: k, v: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0]};
        if(r.value) {
          var jval = JSON.parse(r.value);
          jval.companies.forEach((v, i) => {
            let o = (i===0)?0:2;
            ms.v[o*i] += v;
            pt[i] += v;
          });
          stats.trips += jval.trips;
          stats.total += jval.total;
          if(k === moment().utc().startOf('month').valueOf()) {
            stats.mtd = jval.total;
          }
        }
        if(details && details.month === k) {
          ms.v[this.highlightIndexes[details.company]] = parseInt(details.total);
        }
        return ms;
      });
      if (stats.trips > 0) {
        stats.average = stats.total / stats.trips;
      }
      var ret = {
        lines: lines,
        pie: pt,
        stats: stats
      };
      if(details) {
        ret.hcompany = details.company;
      }
      console.log('sift-taxi: _getMonthData: return: ', ret);
      return ret;
    });
  }

  _getChartKeys(width, details) {
    let num = 6;
    if(width === 'full' || width === 'large') {
      num = 12;
    }
    var chartKeys = [];
    for (var i = 0; i < num; i++) {
      if (details) {
        chartKeys.unshift(moment.utc(parseInt(details.month)).subtract(i, 'months').valueOf().toString());
      }
      else {
        chartKeys.unshift(moment().utc().startOf('month').subtract(i, 'months').valueOf().toString());
      }
    }
    return chartKeys;
  }
}

// FIXXME: how can we automate the registration without developer interaction
registerSiftController(new TaxiController());
