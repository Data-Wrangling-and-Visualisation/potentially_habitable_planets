document.addEventListener('DOMContentLoaded', function () {
    let animationOn = true;
    let planetNodes = [];

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

    const notePanel = d3.select("body")
        .append("div")
        .attr("class", "note-panel")
        .style("position", "fixed")
        .style("top", "20px")
        .style("right", "20px")
        .style("width", "280px")
        .style("max-height", "400px")
        .style("overflow-y", "auto")
        .style("background", "#08141f")
        .style("color", "#f1f1f1")
        .style("padding", "16px")
        .style("border-radius", "12px")
        .style("box-shadow", "0 0 15px rgba(91, 255, 135, 0.3)")
        .style("display", "none")
        .style("z-index", 20);

    fetch('/api/planets')
        .then(res => res.json())
        .then(planets => {
            initControls(planets);
            drawOrbitChart(planets);
        });

    function initControls(planets) {
        const uniqueNotes = [...new Set(planets.map(p => p.Note || 'None'))];

        const controlBox = d3.select("#orbit-controls")
            .style("margin-bottom", "10px");

        const select = controlBox
            .append("select")
            .attr("id", "note-filter")
            .style("margin-right", "10px")
            .style("padding", "4px 8px")
            .style("border-radius", "6px")
            .style("border", "1px solid #aaa");

        select.append("option").text("All Notes").attr("value", "all");

        uniqueNotes.forEach(note => {
            select.append("option").text(note).attr("value", note);
        });

        select.on("change", function () {
            const value = this.value;
            const filtered = value === "all" ? planets : planets.filter(p => p.Note === value);
            d3.select("#orbit-chart").selectAll("*").remove();
            drawOrbitChart(filtered);
        });

        controlBox.append("button")
            .text("Toggle Animation")
            .style("padding", "4px 10px")
            .style("border", "none")
            .style("border-radius", "6px")
            .style("background", "#7ecbff")
            .style("color", "#001828")
            .style("cursor", "pointer")
            .on("click", () => animationOn = !animationOn);
    }

    function drawOrbitChart(planets) {
        planetNodes = []; // Clear old nodes

        const width = 600, height = 600;
        const centerX = width / 2, centerY = height / 2;

        const svg = d3.select("#orbit-chart")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("background", "radial-gradient(#0b1b2a, #010f1a)");

        const defs = svg.append("defs");
        const glow = defs.append("filter")
            .attr("id", "planet-glow");
        glow.append("feGaussianBlur")
            .attr("stdDeviation", "3.5")
            .attr("result", "coloredBlur");
        const feMerge = glow.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        const sunGradient = defs.append("radialGradient")
            .attr("id", "sunGradient")
            .attr("cx", "50%").attr("cy", "50%");
        sunGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#ffdf75");
        sunGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#ffc200");

        svg.append("circle")
            .attr("cx", centerX)
            .attr("cy", centerY)
            .attr("r", 16)
            .style("fill", "url(#sunGradient)")
            .style("filter", "url(#planet-glow)");

        const radiusScale = d3.scaleSqrt()
            .domain([0, d3.max(planets, d => +d['Period (days)'] || 0)])
            .range([30, 250]);

        const pastelColors = d3.scaleOrdinal(d3.schemePastel1);

        planets.forEach((planet, i) => {
            const orbitRadius = radiusScale(+planet['Period (days)'] || 0);
            const angle = Math.random() * 2 * Math.PI;

            svg.append("circle")
                .attr("cx", centerX)
                .attr("cy", centerY)
                .attr("r", orbitRadius)
                .attr("fill", "none")
                .attr("stroke", "rgba(255,255,255,0.08)")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "3,4");

            const color = planet.Note?.toLowerCase().includes("habitable") ? "#7fff8c" : pastelColors(i);

            const planetNode = svg.append("circle")
                .attr("r", 5.5)
                .style("fill", color)
                .style("filter", "url(#planet-glow)")
                .datum({
                    angle,
                    orbitRadius,
                    speed: 0.001 + Math.random() * 0.001,
                    planet
                })
                .on("mouseover", function (event, d) {
                    d3.select(this).transition().attr("r", 8);
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
                    d3.select(this).transition().attr("r", 5.5);
                    tooltip.style("visibility", "hidden");
                })
                .on("click", function (event, d) {
                    notePanel.style("display", "block")
                        .html(`<h3>${d.planet.Object}</h3><p>${d.planet.Note || "No additional notes"}</p>`);
                });

            planetNodes.push({ element: planetNode, angle, orbitRadius, speed: planetNode.datum().speed });
        });
    }

    // Persistent animation loop
    d3.timer(() => {
        if (!animationOn || !planetNodes.length) return;
        const centerX = 300, centerY = 300;
        planetNodes.forEach(d => {
            d.angle += d.speed;
            const x = centerX + d.orbitRadius * Math.cos(d.angle);
            const y = centerY + d.orbitRadius * Math.sin(d.angle);
            d.element.attr("cx", x).attr("cy", y);
        });
    });
});
