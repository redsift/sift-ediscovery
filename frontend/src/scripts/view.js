/**
 * Sift Ediscovery. Frontend view entry point.
 */

import { SiftView, registerSiftView } from '@redsift/sift-sdk-web';

export default class sift-ediscovery extends SiftView {
    constructor() {
        // You have to call the super() method to initialize the base class.
        super();

        // Stores the currently displayed data so view can be reflown during transitions
        this.ldButton = true;
        this.ncButton = true;
        this.ncCount = 0;

        // Listens for 'count' events from the Controller
        this.subscribe('count', this.onStorageUpdate.bind(this));
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
        console.log('sift-ediscovery: presentView: ', value);

        /*
         * Example code below can be removed
         */
        // Simple dom updates for the data we received after transition is over.
        updateDOM('width', value.sizeClass.current.width);
        updateDOM('height', value.sizeClass.current.height);
        updateDOM('message', value.data.message);
        updateDOM('type', value.type);

        if (this.ldButton) {
            this.ldButton = document.getElementById('load-data');
            this.ldButton.addEventListener('click', () => {
                console.log('sift-ediscovery: ldButton clicked');
                this.loadData({
                    key: 'TOTAL'
                }).then((result) => {
                    console.log('sift-ediscovery: loadData returned: ', result);
                    var msg = 'No data yet. Please run your DAG.';
                    if (result) {
                        msg = result + ' emails from @gmail.com in your inbox';
                    }
                    document.getElementById('data').textContent = msg;
                });
            });
        }

        if (this.ncButton) {
            this.ncButton = document.getElementById('notify-controller');
            this.ncButton.addEventListener('click', () => {
                this.ncCount++;
                console.log('sift-ediscovery: this.ncButton clicked: ', this.ncCount);
                this.publish('ncButton-pressed', this.ncCount);
            });
        }
    };

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
        console.log('sift-ediscovery: willPresentView: ', value);

        /*
         * Example code below can be removed
         */
        // Depict how often this event is fired while transitions take place
        showTransitions('width', value.sizeClass);
        showTransitions('height', value.sizeClass);

        var m = document.getElementById('message');
        if (!m) {
            console.info('Missing dom element for example:', m);
            return;
        }
        m.textContent = 'will present view';
        m.style.color = '#ED1651';
    };

    onStorageUpdate(data) {
        console.log('sift-ediscovery: oncount', data);
        document.getElementById('data').textContent = 'New data: ' + data + ' emails from \'gmail.com\' in your inbox';
    }
}

registerSiftView(new sift-ediscovery(window));

function updateDOM(elem, value) {
    var e = document.getElementById(elem);

    if (!e) {
        console.info('Missing dom element for example:', elem);
        return;
    }

    if (parent) {
        e.textContent = value;
        e.style.color = '#231F20';
    }
}

function showTransitions(aspect, parent) {
    if (!parent || !parent.current || !parent.previous) {
        console.error('No data for this transition');
        return;
    }

    var current = parent.current[aspect];
    var previous = parent.previous[aspect];
    var e = document.getElementById(aspect);

    if (!e) {
        console.info('Missing dom element for example:', aspect);
        return;
    }

    if (current !== previous) {
        e.textContent = previous + ' > ' + current;
        e.style.color = '#ED1651';
    }
}
