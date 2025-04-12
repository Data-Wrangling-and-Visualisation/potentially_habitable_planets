document.addEventListener('DOMContentLoaded', function () {
    fetch('/api/planets')
        .then(res => res.json())
        .then(data => {
            drawStarMap(data);
        });
});

function drawStarMap(planets) {
    const width = 800, height = 600;

    const svg = d3.select('#starmap-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', '#0c3157') // dark blue space
        .call(d3.zoom().on('zoom', function (event) {
            g.attr('transform', event.transform);
        }));

    const g = svg.append('g');

    const stars = d3.groups(planets, d => d.Star).map(([star, group]) => {
        const habScore = group.filter(p => p.Note && p.Note.includes("habitable")).length / group.length;
        return {
            name: star,
            planets: group,
            count: group.length,
            habitability: habScore,
            constellation: group[0].Constellation,
            type: group[0]['Star type'],
            note: group.map(p => p.Note).filter(Boolean).join('<br><br>'),
            x: Math.random() * width,
            y: Math.random() * height,
            // Add velocity properties for subtle movement
            vx: (Math.random() - 0.5) * 0.2, // small x velocity
            vy: (Math.random() - 0.5) * 0.2  // small y velocity
        };
    });

    const radiusScale = d3.scaleSqrt()
        .domain([1, d3.max(stars, d => d.count)])
        .range([4, 15]);

    const colorScale = d3.scaleLinear()
        .domain([0, 1])
        .range(['#efe490', '#6ebf11']); // soft yellow-white

    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', 'rgba(255, 255, 255, 0.95)')
        .style('color', '#1c1c2e')
        .style('padding', '10px 14px')
        .style('border-radius', '8px')
        .style('font-size', '13px')
        .style('max-width', '300px')
        .style('box-shadow', '0 0 12px rgba(255, 255, 255, 0.3)');

    // Description panel for Notes
    const notePanel = d3.select('body')
        .append('div')
        .attr('class', 'note-panel')
        .style('position', 'fixed')
        .style('top', '20px')
        .style('right', '20px')
        .style('width', '300px')
        .style('max-height', '400px')
        .style('overflow-y', 'auto')
        .style('background', 'rgba(13, 27, 42, 0.95)')
        .style('color', '#f1f1f1')
        .style('padding', '15px')
        .style('border-radius', '12px')
        .style('box-shadow', '0 0 15px rgba(91, 255, 135, 0.3)')
        .style('display', 'none')
        .style('z-index', 10);

    // Create star elements
    const starElements = g.selectAll('circle.star')
        .data(stars)
        .enter()
        .append('circle')
        .attr('class', 'star')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', d => radiusScale(d.count))
        .style('fill', d => colorScale(d.habitability))
        .style('stroke', '#eeeeee')
        .style('stroke-width', 0.7)
        .style('filter', 'url(#glow)')
        .on('mouseover', function (event, d) {
            d3.select(this)
                .style('fill', '#0c51fb')
                .attr('r', radiusScale(d.count) + 4);

            tooltip.style('visibility', 'visible')
                .html(`<strong>Star:</strong> ${d.name}<br>
                       <strong>Type:</strong> ${d.type}<br>
                       <strong>Planets:</strong> ${d.count}<br>
                       <strong>Habitability:</strong> ${(d.habitability * 100).toFixed(0)}%<br>
                       <strong>Constellation:</strong> ${d.constellation}`);
        })
        .on('mousemove', function (event) {
            tooltip.style('top', (event.pageY + 15) + 'px')
                   .style('left', (event.pageX + 15) + 'px');
        })
        .on('mouseout', function (event, d) {
            d3.select(this)
                .style('fill', colorScale(d.habitability))
                .attr('r', radiusScale(d.count));

            tooltip.style('visibility', 'hidden');
        })
        .on('click', function (event, d) {
            if (d.note) {
                notePanel.style('display', 'block')
                         .html(`<h3 style="margin-bottom: 10px;">${d.name} - Notes</h3>${d.note}`);
            } else {
                notePanel.style('display', 'none');
            }
        });

    // Glow filter
    const defs = svg.append("defs");
    const filter = defs.append("filter")
        .attr("id", "glow");
    filter.append("feGaussianBlur")
        .attr("stdDeviation", "3.5")
        .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode")
        .attr("in", "coloredBlur");
    feMerge.append("feMergeNode")
        .attr("in", "SourceGraphic");

    // Legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 160}, 30)`);

    legend.append("text")
        .text("Habitability")
        .attr("font-size", 14)
        .attr("font-weight", "bold")
        .attr("fill", "#f0f0f0");

    const grad = d3.range(0, 1.05, 0.2);
    grad.forEach((d, i) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 20 + i * 20)
            .attr("width", 20)
            .attr("height", 18)
            .attr("fill", colorScale(d));
        legend.append("text")
            .attr("x", 28)
            .attr("y", 34 + i * 20)
            .text(`${(d * 100).toFixed(0)}%`)
            .attr("font-size", 12)
            .attr("fill", "#eee");
    });

    // Animation function for subtle star movement
    function animate() {
        starElements.each(function(d) {
            // Update position with velocity
            d.x += d.vx;
            d.y += d.vy;

            // Bounce off walls
            if (d.x < 0 || d.x > width) d.vx *= -1;
            if (d.y < 0 || d.y > height) d.vy *= -1;

            // Apply small random changes to velocity for organic movement
            d.vx += (Math.random() - 0.5) * 0.01;
            d.vy += (Math.random() - 0.5) * 0.01;

            // Limit maximum speed
            const maxSpeed = 0.3;
            const speed = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
            if (speed > maxSpeed) {
                d.vx = (d.vx / speed) * maxSpeed;
                d.vy = (d.vy / speed) * maxSpeed;
            }
        });

        // Update positions
        starElements
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);

        // Continue animation
        requestAnimationFrame(animate);
    }

    // Start animation
    animate();
}

