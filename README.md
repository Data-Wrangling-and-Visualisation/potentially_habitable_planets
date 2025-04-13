# Potentially Habitable Planets
---
### Team members:
|name|email|
|-|----------|
|Mariia Shmakova|m.shmakova@innopolis.university|
|Aruzhan Shinbayeva | a.shinbaeyeva@innopolis.university|
|Alsu Khairullina | a.khairullina@innopolis.university|


### Data Scraping
The data was scrapped from 3 sources using requests and pandas libraries:

1. [Earth Anagogs](https://en.wikipedia.org/wiki/Earth_analog) in wikipedia
<img src="images/earth_analogs.png" alt="Компьютер" width="600" height="200">

2. [List](https://en.wikipedia.org/wiki/List_of_potentially_habitable_exoplanets) of potentially habitable exoplanets in wikipedia

<img src="images/list_exoplanets.png" alt="Компьютер" width="600" height="200">

3. [Exoplanets data](https://exoplanetarchive.ipac.caltech.edu/) from NASA exoplanet archive

<img src="images/nasa_list.png" alt="Компьютер" width="600" height="200">

Then the data was combined into a single table using concatination in pandas.

Next, we collected data on each exoplanet from another [NASA website](https://science.nasa.gov/exoplanets/exoplanet-catalog/), where it was described in more detail about each of the planets and added the missing data to the table.

### Data Cleaning and Preprocessing
The data as it is contains a lot of inappropriate characters and spaces. 

<img src="images/before_remove_stop_words.png" alt="Компьютер" width="500" height="250">

To improve our data, we will first remove the symbols (for example, ±, ≥, ~).

<img src="images/after_remove_stop_words.png" alt="Компьютер" width="500" height="250">

Then fill in the missing data using Gemini LLM.

<img src="images/ready_made_df.png" alt="Компьютер" width="600" height="200">

### Data Exploration and Processing
The most important class distributions:

<img src="images/class_distributions.png" alt="Компьютер" width="600" height="200">

<img src="images/T_by_star_type.png" alt="Компьютер" width="600" height="200">

Features of the paired graph, here we can see that the Flow is directly proportional to the Temperature, the Period of rotation is directly proportional to the Temperature, the Mass of planet is proportional to the Radius of planet.

<img src="images/pairplot_features.png" alt="Компьютер" width="600" height="500">

The correlation matrix confirms the conclusions drawn on the paired graphs.

<img src="images/correlation_matrix.png" alt="Компьютер" width="600" height="400">

Then we start to plot some correlations between the classes:

<img src="images/mass_by_star_type.png" alt="Компьютер" width="600" height="400">

<img src="images/mass_vs_radius.png" alt="Компьютер" width="600" height="400">

<img src="images/mass_radius_Temp.png" alt="Компьютер" width="600" height="400">

The relationship between the flow and temperature of the star is shown, with the additional allocation of the planet's radius as points on the graph.

<img src="images/T_vs_Flux.png" alt="Компьютер" width="600" height="400">

The relationship between the radius and flux of the star is shown, with the additional allocation of the planet's radius as points on the graph, as well as the division into zones: the purple zone of early Mars, the green habitable zone and the red runaway Greenhouse.

<img src="images/radius_Flux_habitable_zones.png" alt="Компьютер" width="600" height="400">

### Data Delivery
The processed data is connected to the visualization of the website using Flask
RESTful API. This application provides data in JSON format, ensuring smooth communication between data processing and the web application.

### Data Visualization
Vizualization on website usinf D3.js with interactive features. 

1. Habitable zone orbitvizualization
The display of planets in orbit, divided into types of planets using an interactive function.

<img src="images/plot1.jpg" alt="Компьютер" width="600" height="400">

2. StarMap
Displaying stars with an interactive function of showing data and dividing stars by the degree of "habitability" according to the formula.

<img src="images/2nd_plot.png" alt="Компьютер" width="600" height="400">

3. Temperature vs. Flux with radius vizualization
Displaying planets with an interactive data display function.

<img src="images/3rd_plot.png" alt="Компьютер" width="600" height="400">



### Running the system

prerequisites: Docker installed on your system.

1. Build image: docker build -t dwv .
2. Run image: docker run -p 5000:5000 dwv
