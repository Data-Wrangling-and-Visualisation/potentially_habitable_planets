document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/planets')
        .then(res => res.json())
        .then(data => {
            createTemperatureFluxChart(data);
        });
});

function createTemperatureFluxChart(planets) {
    // Filter out planets with missing data
    const validPlanets = planets.filter(d => d.Teq && d.Flux && d.Radius);

    // Set up dimensions
    const margin = {top: 50, right: 100, bottom: 70, left: 70};
    const width = 900 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    // Create SVG container
    const svg = d3.select('#temperature-flux-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .style('background', 'radial-gradient(ellipse at center, #0a0e24 0%, #000000 100%)')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -20)
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('fill', '#fff')
        .text('Planetary Equilibrium Temperature vs Flux');

    // Scales
    const xScale = d3.scaleLog()
        .domain([d3.min(validPlanets, d => +d.Flux), d3.max(validPlanets, d => +d.Flux)])
        .range([0, width])
        .nice();

    const yScale = d3.scaleLog()
        .domain([d3.min(validPlanets, d => +d.Teq), d3.max(validPlanets, d => +d.Teq)])
        .range([height, 0])
        .nice();

    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(validPlanets, d => +d.Radius)])
        .range([2, 20]);

    const colorScale = d3.scaleOrdinal()
        .domain(['M', 'K', 'G', 'F', 'A', 'B', 'O'])
        .range(['#ff6b35', '#ffb563', '#ffd166', '#06d6a0', '#118ab2', '#073b4c', '#8338ec']);

    // Add axes
    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.format('.1f'))
        .tickSizeOuter(0);

    const yAxis = d3.axisLeft(yScale)
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

    // Add grid lines
    svg.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale)
            .tickSize(-height)
            .tickFormat(''))
        .selectAll('line')
        .style('stroke', '#333')
        .style('stroke-dasharray', '2,2');

    svg.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat(''))
        .selectAll('line')
        .style('stroke', '#333')
        .style('stroke-dasharray', '2,2');

    // Add glow filter
    const defs = svg.append('defs');
    const glowFilter = defs.append('filter')
        .attr('id', 'glow')
        .attr('width', '150%')
        .attr('height', '150%');

    glowFilter.append('feGaussianBlur')
        .attr('stdDeviation', '3')
        .attr('result', 'blur');

    glowFilter.append('feComposite')
        .attr('in', 'SourceGraphic')
        .attr('in2', 'blur')
        .attr('operator', 'over');

    // Prepare planet data with initial positions and velocities
    const movingPlanets = validPlanets.map(d => ({
        ...d,
        x: xScale(+d.Flux),
        y: yScale(+d.Teq),
        radius: radiusScale(+d.Radius),
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        originalX: xScale(+d.Flux),
        originalY: yScale(+d.Teq),
        starType: d['Star type'] ? d['Star type'].charAt(0) : 'G'
    }));

    // Create planet circles with initial positions
    const planetCircles = svg.selectAll('.planet')
        .data(movingPlanets)
        .enter()
        .append('circle')
        .attr('class', 'planet')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', d => d.radius)
        .style('fill', d => colorScale(d.starType))
        .style('opacity', 0.8)
        .style('stroke', '#fff')
        .style('stroke-width', 0.5)
        .style('filter', 'url(#glow)');

    // Add tooltip
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', 'rgba(10, 14, 36, 0.9)')
        .style('color', '#ffffff')
        .style('padding', '10px')
        .style('border-radius', '5px')
        .style('border', '1px solid #4a6da7')
        .style('pointer-events', 'none')
        .style('z-index', '10');

    // Add interactivity
    planetCircles
        .on('mouseover', function(event, d) {
            d3.select(this)
                .style('stroke-width', '2px')
                .style('opacity', 1);

            tooltip.style('visibility', 'visible')
                .html(`
                    <strong>${d.Object}</strong><br>
                    Star: ${d.Star} (${d['Star type']})<br>
                    Radius: ${d.Radius} R⊕<br>
                    Flux: ${d.Flux} F⊕<br>
                    Temp: ${d.Teq} K<br>
                    ${d.Note ? 'Note: ' + d.Note : ''}
                `);
        })
        .on('mousemove', function(event) {
            tooltip.style('top', (event.pageY - 10) + 'px')
                  .style('left', (event.pageX + 10) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this)
                .style('stroke-width', '0.5px')
                .style('opacity', 0.8);

            tooltip.style('visibility', 'hidden');
        });

    // Animation function for 3D-like movement
    function animate() {
        planetCircles.each(function(d) {
            // Update position with velocity
            d.x += d.vx;
            d.y += d.vy;

            // Add attraction back to original position (simulating 3D depth)
            d.vx += (d.originalX - d.x) * 0.005;
            d.vy += (d.originalY - d.y) * 0.005;

            // Add small random movement
            d.vx += (Math.random() - 0.5) * 0.1;
            d.vy += (Math.random() - 0.5) * 0.1;

            // Apply damping
            d.vx *= 0.98;
            d.vy *= 0.98;

            // Calculate distance from original position for size effect
            const distance = Math.sqrt(
                Math.pow(d.x - d.originalX, 2) +
                Math.pow(d.y - d.originalY, 2)
            );

            // Simulate 3D perspective with size change
            const sizeFactor = 1 + distance * 0.002;
            d.currentRadius = d.radius * sizeFactor;
        });

        // Update positions and sizes
        planetCircles
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', d => d.currentRadius);

        requestAnimationFrame(animate);
    }

    // Start animation
    animate();

    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 120}, 20)`);

    const starTypes = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];

    legend.selectAll('.legend-item')
        .data(starTypes)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`)
        .each(function(d) {
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