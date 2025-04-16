document.addEventListener('DOMContentLoaded', function () {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = function () {
        initApp();
    };
    document.head.appendChild(script);
});

let planetsData = [];

function initApp() {
    fetch('/api/planets')
        .then(response => response.json())
        .then(data => {
            planetsData = data;
            initPlanetSelect(data);

            document.getElementById('compare-btn').addEventListener('click', function () {
                const selected = getSelectedPlanets();

                if (selected.length > 0) {
                    createComparisonChart(selected);
                } else {
                    alert('Please select at least one planet');
                }
            });
        })
        .catch(error => {
            console.error('Error loading data:', error);
            document.getElementById('comparison-chart').innerHTML =
                '<p class="error">Error loading planet data</p>';
        });
}

function initPlanetSelect(planets) {
    const select = document.getElementById('planet-select');
    planets.forEach(planet => {
        const option = document.createElement('option');
        option.value = planet.Object;
        option.textContent = `${planet.Object} (${planet['Star type']})`;
        select.appendChild(option);
    });
}

function getSelectedPlanets() {
    const selectedOptions = Array.from(document.getElementById('planet-select').selectedOptions);
    return selectedOptions.map(opt => opt.value);
}

function createComparisonChart(selectedPlanetNames) {
    const ctx = document.getElementById('comparison-chart');

    if (window.comparisonChart) {
        window.comparisonChart.destroy();
    }

    const selectedPlanets = planetsData.filter(p => selectedPlanetNames.includes(p.Object));
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8AC24A', '#EA80FC'];

    const datasets = selectedPlanets.map((planet, index) => ({
        label: planet.Object,
        data: [
            planet['Mass (M⊕)'],
            planet['Radius (R⊕)'],
            planet['Flux (F⊕)'],
            planet['Teq (K)'],
            planet['Distance (ly)']
        ],
        backgroundColor: colors[index % colors.length] + '33',
        borderColor: colors[index % colors.length],
        borderWidth: 2,
        pointBackgroundColor: colors[index % colors.length],
        pointRadius: 4,
        pointHoverRadius: 6
    }));

    window.comparisonChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Mass (M⊕)', 'Radius (R⊕)', 'Flux (F⊕)', 'Temperature (K)', 'Distance (ly)'],
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Planet Characteristics Comparison',
                    font: { size: 16 }
                },
                legend: {
                    position: 'right',
                    labels: {
                        font: { size: 12 },
                        padding: 20
                    }
                },
                tooltip: {
                    callbacks: {
                        label: context => `${context.dataset.label}: ${context.raw}`
                    }
                }
            },
            scales: {
                r: {
                    angleLines: { display: true },
                    suggestedMin: 0,
                    ticks: {
                        font: { size: 11 }
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.1
                }
            }
        }
    });
}

function getColorForStarType(type, alpha = 1) {
    const colors = {
        'O': `rgba(0, 191, 255, ${alpha})`, // Голубой
        'B': `rgba(135, 206, 235, ${alpha})`, // Бело-голубой
        'A': `rgba(255, 255, 255, ${alpha})`, // Белый
        'F': `rgba(255, 255, 224, ${alpha})`, // Жёлто-белый
        'G': `rgba(255, 215, 0, ${alpha})`, // Жёлтый
        'K': `rgba(255, 165, 0, ${alpha})`, // Оранжевый
        'M': `rgba(255, 0, 0, ${alpha})` // Красный
    };

    for (const key in colors) {
        if (type.includes(key)) return colors[key];
    }

    return `rgba(199, 199, 199, ${alpha})`;
}