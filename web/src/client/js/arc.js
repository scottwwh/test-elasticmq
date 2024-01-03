
// TODO: Detect and adapt to available block size
// const w = client.screenWidth - ( margin.left + margin.right );

/**
 * Reference: https://d3-graph-gallery.com/graph/arc_highlight.html
 */

window.addEventListener('resize', e => {
  init();
  update(dataCache);
});


const margin = {top: 40, right: 80, bottom: 40, left: 80};
let svg = null,
  dataCache = null,
  width = 0,
  height = 0;


function init() {
  // Relies on CSS sizing
  const rect = document.querySelector("#my_dataviz").getBoundingClientRect();

  // Set the dimensions and margins of the graph
  width = rect.width - margin.left - margin.right;
  height = rect.height - margin.top - margin.bottom;

  // TODO: Revisit how I can do this with D3
  const elSvg = document.querySelector("#my_dataviz svg");
  if (elSvg) {
    console.log('Resize SVG');
    elSvg.setAttribute("width", width + margin.left + margin.right)
    elSvg.setAttribute("height", height + margin.top + margin.bottom);
  }
}

init();


// append the svg object to the body of the page
svg = d3.select("#my_dataviz")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");



let previousData = d3.local();


function update(data) {

  // console.log(data);
  dataCache = data;

  // List of node names
  var allNodes = data.nodes.map(function(d){return d.name})

  // A linear scale to position the nodes on the X axis
  var x = d3.scalePoint()
    .range([0, width])
    .domain(allNodes)

  // Working attempt to polish adding nodes 1 and 2
  const xNew = function(d, i) {
    if (data.nodes.length === 2) {
      console.log(i);          
      return width / 3 * (i + 1);
    }
    
    return x(d.name)
  }

  // Add the circle for the nodes
  var nodes = svg
    .selectAll("circle")
    .data(data.nodes, function(d) { return d.id }); // Necessary for clean removal

  nodes
    .data(data.nodes)
    .enter().append("circle")
      .attr("r", 10)
      .style("fill", "orange")
      .style("opacity", 0)
      .attr("cy", height - 30)
    // Applies to both links and links.enter()
    .merge(nodes)
      .attr("cx", function(d){ return x(d.name)})
      .transition()
      .style("fill", "#ddd")
      .style("opacity", 1)
      .attr("r", function(d){ return d.weight * 5 + 5})

  nodes
    .exit()
    .transition()
    .style("opacity", 0)
    .remove();
  
  // TODO: Combine with nodes
  //
  // ..and give them a label
  var labels = svg
    .selectAll("text")
    .data(data.nodes, function(d) { return d.id }); // Necessary for clean removal

  labels
    .enter().append(function(d) {
        const names = d.name.split(' ');      
        const elText = document.createElementNS(d3.namespaces.svg, 'text');
        elText.setAttribute("font-size", "0.7rem");
        elText.setAttribute("style", "text-anchor: middle");
        elText.setAttribute("transform", `translate(${x(d.name)} ${height})`);

        const elFirst = document.createElementNS(d3.namespaces.svg, 'tspan');
        elFirst.textContent = names[0];

        const elSecond = document.createElementNS(d3.namespaces.svg, 'tspan');
        elSecond.setAttribute("x", 0);
        elSecond.setAttribute("y", 12.5);
        elSecond.textContent = names[1];

        elText.appendChild(elFirst);
        elText.appendChild(elSecond);

        return elText;
      })
      .style("opacity", 0)
    .merge(labels)
      .transition()
      .style("opacity", 1)
      .attr("transform", function(d) { return `translate(${x(d.name)} ${height})` });

  labels
    .exit()
    .transition()
    .style("opacity", 0)
    .remove();


  // Add hash map between IDs and their nodes
  var idToNode = {};
  data.nodes.forEach(function (n) {
    idToNode[n.id] = n;
  });

  // Debug
  function idExists(id) {
    const exists = Boolean(idToNode[id]);
    console.log(`${id} exists? ${exists}`);
  }


  // Add the links
  var links = svg
    .selectAll('path')
    .data(data.links, function(d) { return d.id }); // Necessary for clean removal

  links
    .enter().append('path')
      .attr("fill", "none")
      .attr("stroke", "#f00")
      .attr("stroke-width", 0)

    // TODO: Refer to official docs: https://d3js.org/d3-selection/joining#selection_join
    //
    // Applies to both links and links.enter()
    .merge(links)
      .attr("stroke", function(d) {
        // Check old data for element for update based on weight
        const weightOld = previousData.get(this);
        if (weightOld < d.weight
            || typeof weightOld === 'undefined'
            )
        {
          return "#f00";
        } else {
          return "#ddd";
        }
      })
      .each(function(d) {
        previousData.set(this, d.weight); // https://d3js.org/d3-selection/locals
      })      
      .transition()
      // .duration(100) // This causes issues with smooth transitions when adding/removing users
      .attr("stroke", "#ddd")
      .attr("stroke-width", function(d) { return d.weight })
      .attr('d', function (d) {

        let start = 0;
        let end = 0;
        try {  
          // TODO: Cap inflexion point of arc to no taller than SVG height
          start = x(idToNode[d.source].name)      // X position of start node on the X axis
          end = x(idToNode[d.target].name)        // X position of end node
        } catch (err) {
          console.log("Found a missing node!");
          // idExists(d.source);
          // idExists(d.target);
        }

        return ['M', start, height - margin.top,      // The arc starts at the coordinate x=start, y=height-30 (where the starting node is)
          'A',                                        // This means we're gonna build an elliptical arc
          (start - end) / 2, ',',                 // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
          (start - end) / 2, 0, 0, ',',
          start < end ? 1 : 0, end, ',', height - margin.top] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
          .join(' ');
      })      

  links.exit()
    .transition()
    .attr("stroke-width", 0)
    .remove();


/*
  // Add the links
  var links = svg
    .selectAll('path')
    .data(data.links, d => d.id); // Necessary for clean removal

  links
    .join(
      enter => enter
        .append('path')
        .attr("stroke", "#f00")
        .each(function(d) {
          console.log('save on enter');
          previousData.set(this, d.weight); // https://d3js.org/d3-selection/locals
        })
        .attr('d', function (d) {

          let start = 0;
          let end = 0;
          try {  
            // TODO: Cap inflexion point of arc to no taller than SVG height
            start = x(idToNode[d.source].name)      // X position of start node on the X axis
            end = x(idToNode[d.target].name)        // X position of end node
          } catch (err) {
            console.log("Found a missing node!");
            // idExists(d.source);
            // idExists(d.target);
          }

          return ['M', start, height - margin.top,      // The arc starts at the coordinate x=start, y=height-30 (where the starting node is)
            'A',                                        // This means we're gonna build an elliptical arc
            (start - end) / 2, ',',                 // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
            (start - end) / 2, 0, 0, ',',
            start < end ? 1 : 0, end, ',', height - margin.top] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
            .join(' ');
        }),
        
      update => update
        .attr("stroke", function(d) {
          // Check old data for element for update based on weight
          if (previousData.get(this) < d.weight) {
            return "#f00";
          } else {
            return "#ddd";
          }
        })
        .each(function(d) {
          console.log('save on enter');
          previousData.set(this, d.weight);
        })
        .transition()
        .attr('d', function (d) {

          let start = 0;
          let end = 0;
          try {  
            // TODO: Cap inflexion point of arc to no taller than SVG height
            start = x(idToNode[d.source].name)      // X position of start node on the X axis
            end = x(idToNode[d.target].name)        // X position of end node
          } catch (err) {
            console.log("Found a missing node!");
            // idExists(d.source);
            // idExists(d.target);
          }

          return ['M', start, height - margin.top,      // The arc starts at the coordinate x=start, y=height-30 (where the starting node is)
            'A',                                        // This means we're gonna build an elliptical arc
            (start - end) / 2, ',',                 // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
            (start - end) / 2, 0, 0, ',',
            start < end ? 1 : 0, end, ',', height - margin.top] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
            .join(' ');
        }),

      exit => exit
        .transition()
        .attr("stroke-width", 0)
        .remove()


    )
    .attr("fill", "none")
    .attr("stroke-width", function(d) { return d.weight })
    // These conflict with transition when adding/removing users
    // .transition()
    // .duration(50)
    .attr("stroke", "#ddd")
    ;
*/


    // Add the highlighting functionality
    nodes
      .on('mouseover', function (d) {

        // Highlight the nodes
        nodes.attr('fill', "#ddd");

        d3.select(this).style('fill', 'orange')

        // Highlight the connections
        links
          .style('stroke', function (link_d) {
            if (link_d.source === d.id || link_d.target === d.id) {
              return 'orange'
            } else {
              return '#ddd';
            }
          })
      })
      .on('mouseout', function (d) {
        nodes.style('fill', "#ddd")
        links.style('stroke', '#ddd')
      })
}

export {
    update
};
