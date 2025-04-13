document.addEventListener('DOMContentLoaded', function () {
    fetch('/api/planets')
        .then(res => res.json())
        .then(planets => {
            createTemperatureFluxChart(planets);
        });
});

function createTemperatureFluxChart(planets) {
    // Filter out planets with missing data
    const validPlanets = planets.filter(d => d['Teq (K)'] && d['Flux (F⊕)'] && d['Radius (R⊕)']);

    // Set up dimensions
    const margin = { top: 50, right: 100, bottom: 70, left: 70 };
    const width = 900 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Create SVG container
    const svg = d3.select('#temperature-flux-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .style('background', 'radial-gradient(#0b1b2a, #010f1a)')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('fill', '#fff')
        .text('2D Planetary Equilibrium Temperature vs Flux vs Radius');

    // Define axis limits
    const fluxLimits = [0.1, 1000]; // Flux (F⊕)
    const tempLimits = [100, 3000]; // Equilibrium Temperature (K)
    const radiusLimits = [0.1, 10]; // Radius (R⊕)

    // Scales with explicit limits
    const xScale = d3.scaleLog()
        .domain(fluxLimits) // Explicitly set domain for Flux (F⊕)
        .range([0, width])
        .nice();

    const yScale = d3.scaleLog()
        .domain(tempLimits)
        .range([height, 0])
        .nice();

    const zScale = d3.scaleLinear()
        .domain(radiusLimits)
        .range([0, 100]); // Depth scale for 3D effect

    const radiusScale = d3.scaleSqrt()
        .domain(radiusLimits)
        .range([2, 20]);

    const colorScale = d3.scaleOrdinal()
        .domain(['M', 'K', 'G', 'F', 'A', 'B', 'O'])
        .range(['#ff6b35', '#ffb563', '#ffd166', '#06d6a0', '#118ab2', '#073b4c', '#8338ec']);

    // Add axes with limited tick values
    const xAxis = d3.axisBottom(xScale)
        .tickValues([0, 1, 10, 100, 1000]) // Limited tick values for Flux (F⊕)
        .tickFormat(d3.format('.1f'))
        .tickSizeOuter(0);

    const yAxis = d3.axisLeft(yScale)
        .tickValues([100, 500, 1000, 2000, 3000]) // Limited tick values for Temperature (K)
        .tickFormat(d3.format('d'))
        .tickSizeOuter(0);

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis)
        .append('text')
        .attr('x', width / 2)
        .attr('y', 45)
        .attr('fill', '#fff')
        .style('text-anchor', 'middle')
        .text('Flux (F⊕)');

    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis)
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -50)
        .attr('x', -height / 2)
        .attr('fill', '#fff')
        .style('text-anchor', 'middle')
        .text('Equilibrium Temperature (K)');

    // Style axes
    svg.selectAll('.axis line, .axis path')
        .style('stroke', '#aaa')
        .style('fill', 'none');

    svg.selectAll('.axis text')
        .style('fill', '#fff');

    // Add glow filter
    const defs = svg.append("defs");
    const glow = defs.append("filter")
        .attr("id", "planet-glow");
    glow.append("feGaussianBlur")
        .attr("stdDeviation", "3.5")
        .attr("result", "coloredBlur");
    const feMerge = glow.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Draw planets
    const planetNodes = [];
    validPlanets.forEach((planet, i) => {
        // Limit planets to the defined Flux range
        if (+planet['Flux (F⊕)'] < fluxLimits[0] || +planet['Flux (F⊕)'] > fluxLimits[1]) return;

        const x = xScale(+planet['Flux (F⊕)']);
        const y = yScale(+planet['Teq (K)']);
        const radius = radiusScale(+planet['Radius (R⊕)']);
        const angle = Math.random() * 2 * Math.PI;

        const color = planet.Note?.toLowerCase().includes("habitable") ? "#7fff8c" : colorScale(i);

        const planetNode = svg.append("circle")
            .attr("r", radius)
            .attr("cx", x)
            .attr("cy", y)
            .style("fill", color)
            .style("filter", "url(#planet-glow)")
            .datum({
                angle,
                originalX: x,
                originalY: y,
                speed: 0.001 + Math.random() * 0.001,
                planet
            })
            .on("mouseover", function (event, d) {
                d3.select(this).transition().attr("r", radius * 1.5);
                tooltip.style("visibility", "visible")
                    .html(`
                        <strong>${d.planet.Object}</strong><br/>
                        🌎 Radius: ${d.planet['Radius (R⊕)']} R⊕<br/>
                        🔥 Temp: ${d.planet['Teq (K)']} K<br/>
                        ☀️ Flux: ${d.planet['Flux (F⊕)']} F⊕<br/>
                        📍 Distance: ${d.planet['Distance (ly)']} ly<br/>
                        📝 Note: ${d.planet.Note || 'None'}
                    `);
            })
            .on("mousemove", function (event) {
                tooltip
                    .style("top", (event.pageY + 10) + "px")
                    .style("left", (event.pageX + 15) + "px");
            })
            .on("mouseout", function () {
                d3.select(this).transition().attr("r", radius);
                tooltip.style("visibility", "hidden");
            });

        planetNodes.push({ element: planetNode, angle, originalX: x, originalY: y, speed: planetNode.datum().speed });
    });

    // Animate planets with 3D effect
    let rotationAngle = 0;
    d3.timer(() => {
        rotationAngle += 0.01; // Rotation speed

        planetNodes.forEach(d => {
            const z = zScale(+d.planet.datum().planet['Radius (R⊕)']); // Depth based on radius
            const depthFactor = Math.sin(rotationAngle + d.angle) * z * 0.01; // Apply depth effect

            // Update position with rotation and depth
            const x = d.originalX + depthFactor * Math.cos(rotationAngle);
            const y = d.originalY + depthFactor * Math.sin(rotationAngle);

            d.element.attr("cx", x).attr("cy", y);
        });
    });

    // Tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "#ffffffdd")
        .style("color", "#1c1c2e")
        .style("padding", "10px")
        .style("border-radius", "8px")
        .style("box-shadow", "0 0 10px rgba(0,0,0,0.3)")
        .style("font-size", "13px");

    // Legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 120}, 20)`);

    const starTypes = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];

    legend.selectAll('.legend-item')
        .data(starTypes)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`)
        .each(function (d) {
            d3.select(this)
                .append('circle')
                .attr('r', 6)
                .style('fill', colorScale(d));

            d3.select(this)
                .append('text')
                .attr('x', 15)
                .attr('y', 4)
                .style('fill', '#fff')
                .text(`Type ${d}`);
        });
}