
var width = 600;
var height = 400;
var textPadding = 20;
var rectWidth = 60;
var rectHeight = 30;
var fontSize = 18;
var resizeTextToNode = false;
var resizeNodeToText = true;
var randomizeInitialPositionsInView = false;
var initiallyFixed = true;
var firstToggle = !initiallyFixed;

// The blocks to show in the diagram, includes names, types, and positions
var devices = [
	{name: 'DDD',  type: 'black'  , fixed: initiallyFixed, x: 100, y: 200},
	{name: 'CCC',  type: 'filter' , fixed: initiallyFixed, x: 200, y: 200},
	{name: 'AAA', type: 'red'    , fixed: initiallyFixed, x: 300, y: 300},
	{name: 'EEE',  type: 'red'    , fixed: initiallyFixed, x: 400, y: 350},
	{name: 'FFF',  type: 'red'    , fixed: initiallyFixed, x: 300, y: 100},
	{name: 'GGG', type: 'red'    , fixed: initiallyFixed, x: 400, y: 200},
	{name: 'HHH', type: 'red'    , fixed: initiallyFixed, x: 500, y: 150},
	{name: 'III',  type: 'red'    , fixed: initiallyFixed, x: 500, y: 250},
	{name: 'JJJ',  type: 'network', fixed: initiallyFixed, x: 300, y: 200}
];

// Links between blocks
var connections = [
	['DDD','CCC'],
	['CCC','JJJ'],
	['EEE','AAA'],
	['GGG','AAA'],
	['CCC','AAA'],
	['AAA', 'JJJ'],
	['FFF', 'JJJ'],
	['GGG','JJJ'],
	['HHH','GGG'],
	['III','GGG']
];

// option to put blocks into semi-random initial positions
if(randomizeInitialPositionsInView) {
	devices.forEach(function(d, i, a) {
		d.x = ((width/2) / a.length * Math.floor(Math.random() * a.length)) + width/4;
		d.y = ((height/2) / a.length * Math.floor(Math.random() * a.length)) + height/4;
	});
}

// array of device names
var names = devices.map(function(dev){return dev.name;});

// all data to be displayed (the combo of blocks and links)
var data = {
	nodes: devices,
	links: connections.map(function(con){return {
		source: names.indexOf(con[0]),
		target: names.indexOf(con[1])
	}})
};

// create the layout with some initial configurations
var force = d3.layout.force()
    .charge(-600)
    .linkDistance(100)
    .size([width, height])
    .on('end', function() {
    	if(firstToggle) {
    		firstToggle = false;
    		model.toggleFixed();
    	}
    });

// create the empty SVG, set it to scall the contents and preserve aspect ration
var svg = d3.select(".diagram").append("svg")
	.attr('preserveAspectRatio', 'xMidYMid meet')
	.attr('viewBox', '0 0 ' + width + ' ' + height);

// add the data to the layout
force
	.nodes(data.nodes)
	.links(data.links)
	.start();

// create lines for each link
var links = svg.selectAll(".link")
	.data(data.links)
	.enter().append("line")
	.attr("class", "link");

// link nodes to devices
var node = svg.selectAll(".node")
	.data(data.nodes);

// create a group for each node/device
var gs = node.enter().append("g")
	.attr("class", function(d){return 'node ' + d.type;})
	.attr('transform', function(d){return 'translate(' + d.x + ',' + d.y + ')'})
	.on('click', function(d) {
		if(!d3.event.defaultPrevented) {
			d3.event.preventDefault();
			model.lastClicked(d.name);
			switch(d.status) {
				case 'good': d.status = 'soso'; break;
				case 'soso': d.status = 'bad'; break;
				case 'bad':  d.status = undefined; break;
				default:     d.status = 'good'; break;
			}
			refreshView();
		}
	});

// create a rectangle in each node group
var rects = gs.append('rect')
	.attr('x', rectWidth/-2)
	.attr('y', rectHeight/-2)
	.attr('width', rectWidth)
	.attr('height', rectHeight)
	.attr('rx', '10')
	.attr('class', 'device');

// add a text element on top of each rectangle
var texts = gs.append("text")
    .attr("dy", ".35em")
    .attr("text-anchor", "middle")
	.text(function(d) { return d.name; });

// optionally resize the node to match the actual text size
// this needs some work because the text will have no size if it hasn't been drawn yet
if(resizeNodeToText) {
	texts[0].forEach(function(t,i) {
		var box = t.getBBox();
		data.nodes[i].w = box.width;
		data.nodes[i].h = box.height;
	});

	rects
		.attr('width', function(d) {return textPadding + d.w;})
		.attr('height', function(d) {return textPadding + d.h;})
		.attr('x', function(d) {return (textPadding + d.w)/-2;})
		.attr('y', function(d) {return (textPadding + d.h)/-2;})
} else if(resizeTextToNode) {
	texts.style("font-size", function(d) {
		return (rectWidth - textPadding) / this.getComputedTextLength() * 12;
	});
}

// make nodes draggable
gs.call(force.drag);

// update positions on each 'tick', it gets called for each iteration of the code calculating the force layout positions
force.on("tick", function() {
	links.attr("x1", function(d) { return d.source.x; })
		.attr("y1", function(d) { return d.source.y; })
		.attr("x2", function(d) { return d.target.x; })
		.attr("y2", function(d) { return d.target.y; });

	gs.attr('transform', function(d){return 'translate(' + d.x + ',' + d.y + ')'});
});

// update the data-status attributes
var refreshView = function() {
	gs.attr('data-status', function(d) {return d.status;});
};

// simple model used to hold the fixed state of the layout, and which node was last clicked
function Model() {
	var self = this;
	self.fixed = ko.observable(initiallyFixed);
	self.lastClicked = ko.observable();
	self.fixedState = ko.pureComputed(function() {
		return self.fixed() ? 'Locked' : 'Unlocked';
	});
	self.toggleFixed = function() {
		data.nodes.forEach(function(d) {
			d.fixed ^= true;
			self.fixed(d.fixed); 
		});
	};
}

var model = new Model();
ko.applyBindings(model);
