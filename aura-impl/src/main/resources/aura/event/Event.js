/*
 * Copyright (C) 2013 salesforce.com, inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*jslint sub: true */
/**
 * @description Creates an Event with name, source component, event definition, event dispatcher, parameters, and sets the fired flag to false.
 * @constructor
 * @param {Object} config
 */
function Event(config) {
    this.source = config["component"];
    this.eventDef = config["eventDef"];
    this.eventDispatcher = config["eventDispatcher"];
    this.eventName = config["name"];
    this.params = {};
    this.fired = false;
}

Event.prototype.auraType = "Event";

/**
 * Gets the source component that fired this component event.
 * This method doesn't work for application events.
 *
 * @returns {Object}
 */
Event.prototype.getSource = function() {
    return this.source;
};

/**
 * Gets the Event Definition.
 * Returns an EventDef object.
 */
Event.prototype.getDef = function(){
    return this.eventDef;
};

/**
 * Gets the name of the Event.
 * Returns a name of type String, the unique identifier that the component can use to call this Action.
 */
Event.prototype.getName = function(){
    return this.eventName;
};

/**
 * Sets parameters for the Event. Does not modify an event that has already been fired.
 * Maps key in config to attributeDefs.
 * @param {Object} config The parameters for the Event.
 */
Event.prototype.setParams = function(config) {
    if (this.fired) {
        $A.assert(false, "Event.setParams(): cannot modify an event that has already been fired.");
    }
    if (config){
        var attributeDefs = this.eventDef.getAttributeDefs();
        for (var key in config){
            if (config.hasOwnProperty(key)) {
                if (attributeDefs[key]) {
                    this.params[key] = config[key];
                } else {
                    $A.warning("Event.setParams(): '"+key+"'('"+config[key]+"') is not a valid parameter. Valid parameter are '"+$A.util.keys(this.eventDef.getAttributeDefs()).join("', '")+"'");
                }
            }
        }
    }
    return this;
};

/**
 * Sets a parameter for the Event. Does not modify an event that has already been fired.
 * @param {String} key The name of the parameter.
 * @param {Object} value The value of the parameter.
 */
Event.prototype.setParam=function(key,value) {
    if (this.fired) {
        $A.assert(false, "Event.setParam(): cannot modify an event that has already been fired.");
    }
    if (this.eventDef.getAttributeDefs()[key]) {
        this.params[key] = value;
    } else {
        $A.warning("Event.setParam(): '"+key+"' is not a valid property. Valid properties are '"+$A.util.keys(this.eventDef.getAttributeDefs()).join("', '")+"'");
    }
};

/**
 * Gets an Event parameter. Returns the parameters.
 * @param {String} name The name of the Event. For example, <code>event.getParam("button")</code> returns the value of the pressed mouse button (0, 1, or 2).
 */
Event.prototype.getParam = function(name){
    return this.params[name];
};

/**
 * Gets all the Event parameters. Returns the collection of parameters.
 */
Event.prototype.getParams = function(){
    return this.params;
};

//#if {"modes" : ["STATS"]}
Event.prototype.statsIndex = [];
//#end

/**
 * Fires the Event. Checks if the Event has already been fired before firing.
 * Returns null if a handler has destroyed the component.
 * Maps the component handlers to the event dispatcher.
 * @param {Object} params Optional A set of parameters for the Event. Any previous parameters of the same name will be overwritten.
 */
Event.prototype.fire = function(params) {
    if (this.fired) {
        aura.assert(false, "Event.fire(): Unable to fire event. Event has already been fired.");
    }

    if(params){
        this.setParams(params);
    }

    //#if {"modes" : ["STATS"]}
    var startTime = (new Date()).getTime();
    //#end

    var stackname = this.eventDef.getDescriptor().getQualifiedName();
    var that = this;

    $A.run(function() {
            that.fired = true;
            var handlers;
            if (that.eventName) {
                //component
                var cmp = that.source;
                while (cmp && cmp.getDef().getEventDef(that.eventName)){
                    var dispatcher = cmp.getEventDispatcher();
                    if (dispatcher) {
                        handlers = dispatcher[that.eventName];
                        if (handlers) {
                            for (var i = 0; i < handlers.length; i++) {
                                handlers[i](that);
                            }
                        }
                    }

                    // A handler might have destroyed the component and we need to stop walking the super chain
                    cmp = cmp.isValid() ? cmp.getSuper() : null;
                }
            } else {
                //application or value
                var def = that.eventDef;

                //Values may pass in a null eventDispatcher if no one is listening.
                if(that.eventDispatcher){
                    while (def) {
                        var qname = def.getDescriptor().getQualifiedName();
                        handlers = that.eventDispatcher[qname];
                        if(handlers){
                            if($A.util.isArray(handlers)){
                                //Value handlers on components use arrays, not objects
                                for(var k=0;k<handlers.length;k++){
                                    handlers[k](that);
                                }
                            }else{
                                for (var key in handlers){
                                    var cmpHandlers = handlers[key];
                                    for(var j = 0;j < cmpHandlers.length; j++){
                                        var handler = cmpHandlers[j];
                                        handler(that);
                                    }
                                }
                            }
                        }

                        def = def.getSuperDef();
                    }
                }
            }
        }, stackname);

    //#if {"excludeModes" : ["PRODUCTION", "PRODUCTIONDEBUG"]}
    // if we have a debug component send event info to the tool
    var auraDebugCmp = $A.util.getDebugToolComponent();
    if(!$A.util.isUndefinedOrNull(auraDebugCmp)) {
    	// event name
    	var outputName =  this.eventName ? this.eventName : this.eventDef.getDescriptor().getQualifiedName();

    	// event params
    	var outputParams = function(eventParams) {
            var outParams = "";
            if (!$A.util.isUndefinedOrNull(eventParams)) {
                for (var p in eventParams) {
                    if (!$A.util.isUndefinedOrNull(p)) {
                        outParams += p + ": " + eventParams[p] + ", ";
                    }
                }
            }
            return " Params={ " + outParams + "}";
    	}

    	// output to debug tool
    	var output = "[" + this.eventDef.getEventType() + "] " + outputName + outputParams(this.getParams());
    	var debugLogEvent = $A.util.getDebugToolsAuraInstance().get("e.aura:debugLog");
    	debugLogEvent.setParams({"type" : "event", "message" : output});
    	debugLogEvent.fire();

    	// listening to aura:systemError and auraStorage:modified events on debug
    	// tool in the child window. Need to fire those events in the window.
    	if ($A.util.isUndefinedOrNull(window.opener)) { // this is the parent window
            if (outputName.indexOf("aura:systemError") != -1) {
                var debugWindowEvent = $A.util.getDebugToolsAuraInstance().get("e.aura:systemError");
                debugWindowEvent.setParams(this.getParams());
                debugWindowEvent.fire();
            }
            if (outputName.indexOf("auraStorage:modified") != -1) {
                var debugWindowEvent = $A.util.getDebugToolsAuraInstance().get("e.auraStorage:modified");
                debugWindowEvent.fire();
            }
    	}
    }
    //#end

    //#if {"modes" : ["STATS"]}
    Event.prototype.statsIndex.push({'event': this, 'startTime': startTime, 'endTime': (new Date()).getTime()});
    //#end
};

//#include aura.event.Event_export
