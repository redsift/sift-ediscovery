/**
 * sift-taxi: frontend view entry point.
 *
 * Copyright (c) 2016 Redsift Limited. All rights reserved.
 */

import { SiftView, registerSiftView } from '@redsift/sift-sdk-web';
import moment from 'moment/moment';
import { select } from 'd3-selection';
import { transition } from 'd3-transition';
import { diagonals, patterns, presentation10 } from '@redsift/d3-rs-theme';
import { html as lines } from '@redsift/d3-rs-lines';
import { html as pies } from '@redsift/d3-rs-pies';
import '@redsift/ui-rs-hero';

export default class TaxiSift extends SiftView {
  constructor() {
    // You have to call the super() method to initialize the base class.
    super();

    // Stores the currently displayed data so view can be reflown during transitions
    this._data = null;
    this._sizeClass = null;

    this._pie = null;
    this._stack = null;

    this.currencySymbols = {
      BRL: 'R$',
      EUR: '€',
      GBP: '£',
      USD: '$'
    };

    this.fill = {
      uber: {
        color: presentation10.standard[presentation10.names.blue],
        pattern: this._getPattern(presentation10.names.blue)
      },
      hailo: {
        color: presentation10.standard[presentation10.names.yellow],
        pattern: this._getPattern(presentation10.names.yellow)
      },
      addisonlee: {
        color: presentation10.standard[presentation10.names.grey],
        pattern: this._getPattern(presentation10.names.grey)
      }
    };

    // TODO: remove once the build pipeline is fixed
    transition();

    // We subscribe to 'storageupdate' updates from the Controller
    this.controller.subscribe('storageupdate', this.onStorageUpdate.bind(this));

    // The SiftView provides lifecycle methods for when the Sift is fully loaded into the DOM (onLoad)
    // NOTE: the registration of these methods will be handled in the SiftView base class and do not have to be
    // called by the developer manually in the next version.
    this.registerOnLoadHandler(this.onLoad.bind(this)); // FIXXME: expose as 'onLoad'
  }

  onLoad() {
    let radios = document.getElementsByName('radios');
    for (let i = 0; i < radios.length; i++) {
      let r = radios.item(i);
      r.addEventListener('click', (ev) => {
        console.log('sift-taxi: change currency: ', ev.target.id);
        this.publish('currency', ev.target.id);
      }, false);
    }
  }

  /**
   * Handles storageupdate events
   * @param data - the new view data
   */
  onStorageUpdate(data) {
    console.log('sift-taxi: storageupdate', data);
    this._data = data;
    this._updateStats(this.currencySymbols[this._data.currency], this._data.stats);
    this._updateCharts(this._data, this._sizeClass);
  }

  /**
   * Called by the framework when the loadView callback in frontend/controller.js calls the resolve function or returns a value
   *
   * Parameters:
   * @value: {
   *  sizeClass: {
   *      previous: {width: 'medium'|'full', height: 'medium'|'full'},
   *      current: {width: 'medium'|'full', height: 'medium'|'full'}
   *    },
   *    type: 'email-detail'|'summary',
   *    data: {object} (data object returned by the load or resolve methods in the controller)
   *  }
   */
  presentView(value) {
    console.log('sift-taxi: presentView: ', value);
    this._sizeClass = value.sizeClass.current;
    if (value.data) {
      this._data = value.data;
      this._updateSubtitles(this._data.lines.length);
      this._updateCurrencySelector(this._data.currency);
      this._updateSections(this._sizeClass.height);
      this._updateStats(this.currencySymbols[this._data.currency], this._data.stats);
      this._updateCharts(this._data, this._sizeClass);
    }
  }

  /**
   * Called when a sift starts to transition between size classes
   *
   * Parameters:
   * @value: {
   *  sizeClass: {
   *    previous: {width: 'medium'|'full', height: 'medium'|'full'},
   *    current: {width: 'medium'|'full', height: 'medium'|'full'}
   *  },
   *  type: 'email-detail'|'summary'
   * }
   * value.sizeClass.current: contains the new height and width of the view (height: medium|full, width: medium|full)
   * value.sizeClass.previous: contains the previous height and width of the view (height: medium|full, width: medium|full)
   */
  willPresentView(value) {
    console.log('sift-taxi: willPresentView: ', value);
  }

  /**
   * Updates the stack and pie charts
   * @params data - the data to display
   * @params scw - the current size class
   */
  _updateCharts(data, sc) {
    this._callChart('#chart',
      this._stack,
      data.lines,
      sc);
    this._callChart('#pie',
      this._pie,
      data.pie,
      sc);
  }

  /**
   * Renders a chart or transitions an existing one
   * @params tr - whether or not to transition
   * @id - the chart div id
   * @data - the data to display
   * @chart - the chart to call
   */
  _callChart(id, chart, data, sc) {
    let width = 600;
    let height = 300;
    let margin = 26;
    let legends = {
      stack: ['Uber', null, 'Hailo', null, 'Addison Lee', null],
      pie: ['Uber', 'Hailo', 'Addison Lee']
    }
    if(sc.width === 'large') {
      width = 450;
    }
    else if(sc.width === 'small' || sc.width === 'medium') {
      width = 200;
      margin = 13;
      legends.stack = ['U', null, 'H', null, 'A', null];
      legends.pie = ['U', 'H', 'A'];
    }
    if(sc.height === 'small' || sc.height === 'medium') {
      height = 200;
    }
    let chartContainer = select(id).datum(data);
    if(chart) {
       chartContainer.transition().call(this._getChart(id, width, height, margin, legends));
    }
    else {
      chartContainer.call(this._getChart(id, width, height, margin, legends))
        .select('svg')
        .call(this.fill.uber.pattern)
        .call(this.fill.hailo.pattern)
        .call(this.fill.addisonlee.pattern);
    }
  }

  /**
   * Updates the sections visibility based on the current Sift container height
   * @param height - the height class size
   */
  _updateSections(height) {
    let show = 'none';
    if(height === 'large' || height === 'full') {
      show = '';
      document.getElementById('journeys-header').classList.remove('first');
      document.getElementById('currency-header').classList.add('first');
    }
    else {
      document.getElementById('journeys-header').classList.add('first');
      document.getElementById('currency-header').classList.remove('first');
    }
    document.getElementById('currency').style.display = show;
    document.getElementById('stats-period').style.display = show;
    document.getElementById('companies-period').style.display = show;
    document.getElementById('totals').style.display = show;
  }

  /**
   * Updates the currency selector
   * @param code - the currency 3-letter code
   */
  _updateCurrencySelector(code) {
    document.getElementById(code).checked = true;
  }

  /**
   * Updates the subtitles with the number of months being displayed
   * @param months - number of months being displayed
   */
  _updateSubtitles(months) {
    let subt = 'last ' + months + ' months';
    document.getElementById('subtitle-journeys').textContent = subt;
    document.getElementById('subtitle-stats').textContent = subt;
    document.getElementById('subtitle-companies').textContent = subt;
  }

  /**
   * Updates the taxi stats
   * @param currency - the currency of the stats
   * @param stats - the stats
   */
  _updateStats(currency, stats) {
    console.log('sift-taxi: _updateStats: ', currency, stats);
    // Stats section
    if (stats.trips) {
      document.getElementById('trips-period').textContent = '' + stats.trips;
    }
    if (stats.average) {
      document.getElementById('averageprice-period').textContent = currency + stats.average.toFixed(0);
    }
    if (stats.total) {
      document.getElementById('totalspend-period').textContent = currency + stats.total.toFixed(0);
    }
    // Totals section
    if(stats.ytd) {
      document.getElementById('ytd').textContent = currency+stats.ytd.toFixed(0);
      if (stats.mtd) {
        document.getElementById('monthtotal').textContent = currency + stats.mtd.toFixed(2);
        document.getElementById('mtd').textContent = currency + stats.mtd.toFixed(0);
      }
      if (stats.today) {
        document.getElementById('today').textContent = currency + stats.today.toFixed(0);
      }
    }
    else {
      // If no spend in ytd, hide the section
      document.getElementById('totals').style.display = 'none';
    }
  }

  _getChart(id, width, height, margin, legends) {
    switch (id) {
      case '#chart':
        return this._getStackChart(width, height, margin, legends.stack);
      case '#pie':
        return this._getPieChart(width, height, margin, legends.pie);
    }
  }

  /**
   * Gets a stacked line chart with the provided customizations
   * @param width - chart width
   * @param height - chart height
   * @param legend - legend for the data series
   * @return {d3} - a d3 chart
   */
  _getStackChart(width, height, margin, legend) {
    if(!this._stack) {
      // Create a base one if one doesn't already exist
      this._stack = lines('stacked')
        .tickCountIndex('utcMonth')
        .labelTime('multi')
        .fill([
          this.fill.uber.color,
          this.fill.uber.pattern.url(),
          this.fill.hailo.color,
          this.fill.hailo.pattern.url(),
          this.fill.addisonlee.color,
          this.fill.addisonlee.pattern.url()])
        .niceIndex(false)
        .stacked(true)
        .animation('value')
        .curve('curveStep')
        .tipHtml((d, i, s) => { return (d.v[s] === 0)?d.v[s]:this.currencySymbols[this._data.currency]+d.v[s].toFixed(2); })
        .tickDisplayValue((d) => { return (d === 0)?d:this.currencySymbols[this._data.currency]+d; })
        .tickDisplayIndex((d) => {
          var m = moment(d);
          if(m.month() === 0) {
            return '\'' + m.format('YY');
          }
          else {
            return m.format('MMM');
          }
        });
    }
    return this._stack.width(width).height(height).legend(legend).margin(margin);
  }

  /**
   * Gets a pie chart with the provided customizations
   * @param width - chart width
   * @param height - chart height
   * @param legend - legend for the data series
   * @return {d3} - a d3 chart
   */
  _getPieChart(width, height, margin, legend) {
    if(!this._pie) {
      // Create a base one if one doesn't already exist
      this._pie = pies()
        .fill([
          this.fill.uber.color,
          this.fill.hailo.color,
          this.fill.addisonlee.color])
        .displayValue((v) => { return (100 * v / this._data.stats.total).toFixed(0) + '%'; });
    }
    return this._pie.width(width).height(height).outerRadius(height/3).legend(legend).margin(margin);
  }

  _getPattern(color) {
    console.log('sift-taxi: _getPattern: ', color);
    let p = diagonals('highlight-fill-' + color, patterns.diagonal1);
    p.foreground(presentation10.lighter[color]);
    p.background(presentation10.darker[color]);
    console.log('sift-taxi: _getPattern: ', p.url());
    return p;
  }
}

// FIXXME: how can we automate the registration without developer interaction like with the Controller?
registerSiftView(new TaxiSift(window));
