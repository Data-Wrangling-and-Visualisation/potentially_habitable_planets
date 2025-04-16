document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/planets')
        .then(res => res.json())
        .then(data => {
            createInteractiveStarMap(data);
        });
});

function createInteractiveStarMap(planets) {
    // Фильтрация данных
    const validPlanets = planets.filter(d => 
        d['Star'] && d['Star type'] && d['Distance (ly)'] && 
        d['Radius (R⊕)'] && d['Teq (K)'] && d['Flux (F⊕)']
    );

    // Группировка по звездным системам
    const starSystems = d3.groups(validPlanets, d => d.Star).map(([star, planets]) => {
        const planetsWithHabitability = planets.map(planet => ({
            ...planet,
            habitability: calculateHabitabilityScore(planet)
        }));
        
        return {
            name: star,
            type: planets[0]['Star type'].charAt(0).toUpperCase(),
            distance: +planets[0]['Distance (ly)'],
            constellation: planets[0]['Constellation'],
            planets: planetsWithHabitability,
            x: Math.random() * 900 + 50,
            y: Math.random() * 500 + 50
        };
    });

    // Настройки визуализации
    const width = 1000, height = 600;
    
    // Создание SVG
    const zoom = d3.zoom()
        .scaleExtent([0.5, 5])
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

    const svg = d3.select('#starmap-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('background', 'radial-gradient(#0b1b2a, #010f1a)')
        .call(zoom);

    const g = svg.append('g');

    // Шкалы размеров (увеличен минимальный размер планет)
    const starSizeScale = d3.scaleSqrt()
        .domain([0.1, d3.max(validPlanets, d => d['Radius (R⊕)'])])
        .range([5, 20]); // Размер звезд

    const planetSizeScale = d3.scaleSqrt()
        .domain([0.1, d3.max(validPlanets, d => d['Radius (R⊕)'])])
        .range([5, 20]); // Минимальный размер увеличен с 1 до 3

    const habitabilityColorScale = d3.scaleLinear()
        .domain([0, 1])
        .range(['#fcfcee', '#00ff00']);

    // Создание панели информации о звездной системе
    const infoPanel = d3.select('body')
        .append('div')
        .attr('class', 'info-panel')
        .style('position', 'fixed')
        .style('top', '20px')
        .style('right', '20px')
        .style('width', '300px')
        .style('max-height', '500px')
        .style('overflow-y', 'auto')
        .style('background', 'rgba(13, 27, 42, 0.95)')
        .style('color', '#f1f1f1')
        .style('padding', '15px')
        .style('border-radius', '12px')
        .style('box-shadow', '0 0 15px rgba(91, 255, 135, 0.3)')
        .style('display', 'none')
        .style('z-index', 10);

    // Кнопка закрытия панели
    infoPanel.append('button')
        .text('×')
        .style('position', 'absolute')
        .style('top', '5px')
        .style('right', '5px')
        .style('background', 'none')
        .style('border', 'none')
        .style('color', '#f1f1f1')
        .style('font-size', '20px')
        .style('cursor', 'pointer')
        .on('click', () => infoPanel.style('display', 'none'));

    // Отрисовка звездных систем
    const starGroups = g.selectAll('.star-system')
        .data(starSystems)
        .enter()
        .append('g')
        .attr('class', 'star-system')
        .attr('transform', d => `translate(${d.x},${d.y})`)
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded));

    // Отрисовка звезд
    starGroups.append('circle')
        .attr('class', 'star')
        .attr('r', d => starSizeScale(d3.max(d.planets, p => p['Radius (R⊕)'])))
        .attr('fill', d => habitabilityColorScale(d3.mean(d.planets, p => p.habitability)))
        .on('mouseover', showStarTooltip)
        .on('mouseout', hideStarTooltip)
        .on('click', (event, d) => showStarInfoPanel(d));

    // Отрисовка планет
    starGroups.each(function(star) {
        const system = d3.select(this);
        const starRadius = starSizeScale(d3.max(star.planets, p => p['Radius (R⊕)']));
        
        star.planets.forEach((planet, i) => {
            const angle = (i / star.planets.length) * Math.PI * 2;
            const distance = starRadius + 20 + i * 20; // Увеличенное расстояние
            
            system.append('circle')
                .attr('class', 'planet')
                .attr('r', planetSizeScale(planet['Radius (R⊕)']))
                .attr('cx', Math.cos(angle) * distance)
                .attr('cy', Math.sin(angle) * distance)
                .attr('fill', habitabilityColorScale(planet.habitability))
                .on('mouseover', (event) => showPlanetTooltip(event, planet))
                .on('mouseout', hidePlanetTooltip);
        });
    });

    // Анимация вращения планет
    function animatePlanets() {
        starGroups.each(function(star) {
            const planets = d3.select(this).selectAll('.planet');
            const now = Date.now();
            
            planets.attr('transform', (d, i) => {
                const angle = (now * 0.0001 * (i+1)) % (Math.PI * 2);
                const distance = starSizeScale(d3.max(star.planets, p => p['Radius (R⊕)'])) + 20 + i * 20;
                return `rotate(${angle * (180/Math.PI)}) translate(${distance},0)`;
            });
        });
        
        requestAnimationFrame(animatePlanets);
    }
    
    animatePlanets();

    // Функция для отображения панели информации о звезде
    function showStarInfoPanel(star) {
        infoPanel.html('')
            .append('button')
            .text('×')
            .style('position', 'absolute')
            .style('top', '5px')
            .style('right', '5px')
            .style('background', 'none')
            .style('border', 'none')
            .style('color', '#f1f1f1')
            .style('font-size', '20px')
            .style('cursor', 'pointer')
            .on('click', () => infoPanel.style('display', 'none'));
        
        infoPanel.append('h3')
            .text(star.name)
            .style('margin-top', '0')
            .style('color', '#4dabf7');
        
        infoPanel.append('p')
            .html(`<strong>Type:</strong> ${star.type}<br>
                  <strong>Distance:</strong> ${star.distance} ly<br>
                  <strong>Constellation:</strong> ${star.constellation}<br>
                  <strong>Planets:</strong> ${star.planets.length}`);
        
        const planetsList = infoPanel.append('div')
            .style('margin-top', '15px');
        
        star.planets.forEach(planet => {
            planetsList.append('div')
                .style('margin-bottom', '15px')
                .style('padding-bottom', '15px')
                .style('border-bottom', '1px solid #2a4a6e')
                .html(`
                    <strong>${planet.Object}</strong><br>
                    🌎 Radius: ${planet['Radius (R⊕)']} R⊕<br>
                    🔥 Temp: ${planet['Teq (K)']} K<br>
                    ☀️ Flux: ${planet['Flux (F⊕)']} F⊕<br>
                    🌱 Habitability: ${(planet.habitability * 100).toFixed(1)}%<br>
                    ${planet.Note ? `<p style="margin-top:5px;">📝 ${planet.Note}</p>` : ''}
                `);
        });
        
        infoPanel.style('display', 'block');
    }

    // Остальные функции остаются без изменений
    function calculateHabitabilityScore(planet) {
        const starTypeWeights = { O: 0, B: 0, A: 0.1, F: 0.7, G: 1.0, K: 0.8, M: 0.3 };
        const starType = planet['Star type'].charAt(0).toUpperCase();
        const starScore = starTypeWeights[starType] || 0;
        
        const radius = planet['Radius (R⊕)'];
        const radiusScore = Math.max(0, 1 - Math.pow((radius - 1.1)/0.3, 2));
        
        const temp = planet['Teq (K)'];
        const tempScore = Math.max(0, 1 - Math.pow((temp - 265)/65, 2));
        
        const flux = planet['Flux (F⊕)'];
        const fluxScore = Math.max(0, 1 - Math.pow((flux - 0.9)/0.6, 2));
        
        const period = planet['Period (days)'] || 365;
        const periodScore = Math.max(0, 1 - Math.pow(Math.log(period/100)/3, 2));
        
        const score = 
            0.25 * starScore +
            0.20 * radiusScore +
            0.20 * tempScore + 
            0.20 * fluxScore +
            0.15 * periodScore;
        
        return Math.min(Math.max(score, 0), 1);
    }

    function dragStarted(event, d) {
        d3.select(this).raise().classed('active', true);
    }
    
    function dragged(event, d) {
        d3.select(this).attr('transform', `translate(${d.x = event.x},${d.y = event.y})`);
    }
    
    function dragEnded(event, d) {
        d3.select(this).classed('active', false);
    }

    function showStarTooltip(event, star) {
        const tooltip = d3.select('#star-tooltip');
        const avgHabitability = d3.mean(star.planets, d => d.habitability) || 0;
        
        tooltip.html(`
            <strong>${star.name}</strong><br/>
            ✨ Type: ${star.type}<br/>
            📍 Distance: ${star.distance} ly<br/>
            🔭 Constellation: ${star.constellation}<br/>
            🪐 Planets: ${star.planets.length}<br/>
            🌱 Habitability: ${(avgHabitability * 100).toFixed(1)}%
        `);
        
        tooltip.style('visibility', 'visible')
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY + 15) + 'px');
    }
    
    function hideStarTooltip() {
        d3.select('#star-tooltip').style('visibility', 'hidden');
    }
    
    function showPlanetTooltip(event, planet) {
        const tooltip = d3.select('#planet-tooltip');
        
        tooltip.html(`
            <strong>${planet.Object}</strong><br/>
            🌎 Radius: ${planet['Radius (R⊕)']} R⊕<br/>
            🔥 Temp: ${planet['Teq (K)']} K<br/>
            ☀️ Flux: ${planet['Flux (F⊕)']} F⊕<br/>
            📍 Distance: ${planet['Distance (ly)']} ly<br/>
            🌱 Habitability: ${(planet.habitability * 100).toFixed(1)}%<br/>
            📝 Note: ${planet.Note || 'None'}
        `);
        
        tooltip.style('visibility', 'visible')
            .style('left', (event.pageX + 15) + 'px')
            .style('top', (event.pageY + 15) + 'px');
    }
    
    function hidePlanetTooltip() {
        d3.select('#planet-tooltip').style('visibility', 'hidden');
    }

    // Легенда
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 180}, 20)`);
    
    legend.append('text')
        .text('Habitability')
        .attr('fill', 'white')
        .attr('font-size', '12px')
        .attr('y', -5);
    
    const gradient = legend.append('defs')
        .append('linearGradient')
        .attr('id', 'habitability-gradient')
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '0%');
    
    gradient.selectAll('stop')
        .data(habitabilityColorScale.range())
        .enter().append('stop')
        .attr('offset', (d, i) => i/(habitabilityColorScale.range().length-1))
        .attr('stop-color', d => d);
    
    legend.append('rect')
        .attr('width', 150)
        .attr('height', 12)
        .style('fill', 'url(#habitability-gradient)');
    
    legend.selectAll('.legend-label')
        .data([0, 0.5, 1])
        .enter().append('text')
        .attr('class', 'legend-label')
        .attr('x', d => d * 150)
        .attr('y', 30)
        .text(d => d)
        .attr('fill', 'white')
        .attr('font-size', '10px')
        .attr('text-anchor', 'middle');
}

// Добавление элементов для подсказок
document.body.insertAdjacentHTML('beforeend', `
    <div id="star-tooltip" class="tooltip"></div>
    <div id="planet-tooltip" class="tooltip"></div>
    <style>
        .tooltip {
            position: absolute;
            visibility: hidden;
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 12px;
            border-radius: 8px;
            pointer-events: none;
            z-index: 10;
            max-width: 250px;
            border: 1px solid #4dabf7;
            box-shadow: 0 0 15px rgba(77, 171, 247, 0.6);
            font-family: Arial, sans-serif;
        }
        .tooltip strong {
            color: #4dabf7;
            font-size: 14px;
            display: inline-block;
            margin-bottom: 5px;
        }
        .info-panel h3 {
            color: #4dabf7;
            margin-bottom: 10px;
        }
        .info-panel strong {
            color: #f1f1f1;
        }
        .star {
            stroke: #fff;
            stroke-width: 0.5px;
        }
        .star-system.active .star {
            stroke-width: 2px;
        }
        .info-panel button:hover {
            color: #4dabf7;
        }
    </style>
`);