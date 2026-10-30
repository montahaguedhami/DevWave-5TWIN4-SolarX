"""Vocabulaire français ajouté à la main par-dessus l'ontologie.

Le lexique de base est généré automatiquement depuis Fuseki (noms des classes,
des individus, valeur de :nom...). Ce fichier ne contient que ce qu'on ne peut
pas déduire de l'ontologie : synonymes, libellés accentués, mots-clés des relations.
"""

# Libellés affichés dans les réponses : classe -> (singulier, pluriel)
CLASS_LABELS = {
    "InstallationProduction": ("installation de production", "installations de production"),
    "CentraleSolaire": ("centrale solaire", "centrales solaires"),
    "CentraleHydraulique": ("centrale hydraulique", "centrales hydrauliques"),
    "ParcEolien": ("parc éolien", "parcs éoliens"),
    "SourceEnergie": ("source d'énergie", "sources d'énergie"),
    "Solaire": ("source solaire", "sources solaires"),
    "Eolienne": ("source éolienne", "sources éoliennes"),
    "Hydraulique": ("source hydraulique", "sources hydrauliques"),
    "Stockage": ("stockage", "stockages"),
    "Batterie": ("batterie", "batteries"),
    "StockageHydraulique": ("stockage hydraulique", "stockages hydrauliques"),
    "Equipement": ("équipement", "équipements"),
    "Capteur": ("capteur", "capteurs"),
    "CompteurIntelligent": ("compteur intelligent", "compteurs intelligents"),
    "Onduleur": ("onduleur", "onduleurs"),
    "Consommateur": ("consommateur", "consommateurs"),
    "Ecole": ("école", "écoles"),
    "Hopital": ("hôpital", "hôpitaux"),
    "Maison": ("maison", "maisons"),
    "Usine": ("usine", "usines"),
    "Entreprise": ("entreprise", "entreprises"),
    "Institution": ("institution", "institutions"),
    "Particulier": ("particulier", "particuliers"),
    "Mesure": ("mesure", "mesures"),
    "MesureConsommation": ("mesure de consommation", "mesures de consommation"),
    "MesureProduction": ("mesure de production", "mesures de production"),
    "MesureStockage": ("mesure de stockage", "mesures de stockage"),
    "LigneTransport": ("ligne électrique", "lignes électriques"),
    "LigneBasseTension": ("ligne basse tension", "lignes basse tension"),
    "LigneMoyenneTension": ("ligne moyenne tension", "lignes moyenne tension"),
    "LigneHauteTension": ("ligne haute tension", "lignes haute tension"),
    "ReseauElectrique": ("réseau électrique", "réseaux électriques"),
    "ReseauDistribution": ("réseau de distribution", "réseaux de distribution"),
    "ReseauTransport": ("réseau de transport", "réseaux de transport"),
    "Localisation": ("lieu", "lieux"),
    "Ville": ("ville", "villes"),
    "Region": ("région", "régions"),
    "ConditionMeteo": ("condition météo", "conditions météo"),
    "Ensoleillement": ("ensoleillement", "ensoleillements"),
    "Precipitation": ("précipitation", "précipitations"),
    "Temperature": ("température", "températures"),
    "VitesseVent": ("vitesse du vent", "vitesses du vent"),
    "Evenement": ("événement", "événements"),
    "Maintenance": ("maintenance", "maintenances"),
    "Inspection": ("inspection", "inspections"),
    "MaintenanceCorrective": ("maintenance corrective", "maintenances correctives"),
    "MaintenancePredictive": ("maintenance prédictive", "maintenances prédictives"),
    "MaintenancePreventive": ("maintenance préventive", "maintenances préventives"),
    "Incident": ("incident", "incidents"),
    "Panne": ("panne", "pannes"),
    "Alerte": ("alerte", "alertes"),
    "Surcharge": ("surcharge", "surcharges"),
}

# Expressions supplémentaires qui désignent une classe
CLASS_SYNONYMS = {
    "InstallationProduction": ["installation", "centrale", "site de production", "producteur", "unite de production"],
    "CentraleSolaire": ["parc solaire", "ferme solaire", "installation solaire", "centrale photovoltaique", "centrale pv"],
    "CentraleHydraulique": ["barrage", "centrale hydroelectrique"],
    "ParcEolien": ["parc eolien", "ferme eolienne", "eolienne"],
    "Eolienne": ["source eolienne", "energie eolienne"],
    "Solaire": ["source solaire", "energie solaire", "soleil"],
    "Hydraulique": ["source hydraulique", "energie hydraulique"],
    "SourceEnergie": ["source", "source d energie", "type d energie", "energie renouvelable"],
    "StockageHydraulique": ["step", "station de pompage", "reservoir", "bassin"],
    "Batterie": ["accumulateur"],
    "Equipement": ["appareil", "materiel", "dispositif"],
    "Capteur": ["sonde", "detecteur"],
    "CompteurIntelligent": ["compteur", "smart meter", "linky"],
    "Onduleur": ["inverter", "convertisseur"],
    "Consommateur": ["client", "batiment", "abonne"],
    "Hopital": ["clinique"],
    "Maison": ["logement", "habitation", "foyer"],
    "Ecole": ["etablissement scolaire", "lycee", "college"],
    "Usine": ["site industriel", "industrie"],
    "Entreprise": ["societe", "industriel"],
    "Mesure": ["releve", "mesure"],
    "MesureConsommation": ["consommation", "mesure de consommation"],
    "MesureProduction": ["production", "mesure de production", "energie produite"],
    "MesureStockage": ["mesure de stockage"],
    "LigneTransport": ["ligne", "ligne electrique", "cable", "liaison"],
    "LigneHauteTension": ["ligne ht", "haute tension", "ligne tht"],
    "LigneMoyenneTension": ["ligne mt", "moyenne tension"],
    "LigneBasseTension": ["ligne bt", "basse tension"],
    "ReseauElectrique": ["reseau"],
    "Localisation": ["lieu", "endroit", "emplacement", "localisation"],
    "Ville": ["ville", "commune", "cite"],
    "Region": ["region", "gouvernorat", "zone"],
    "ConditionMeteo": ["meteo", "condition meteo", "condition meteorologique", "climat"],
    "Ensoleillement": ["irradiance", "ensoleillement", "rayonnement"],
    "Precipitation": ["pluie", "precipitation"],
    "VitesseVent": ["vitesse du vent", "vitesse de vent", "vent"],
    "Evenement": ["evenement"],
    "Maintenance": ["intervention", "reparation", "entretien"],
    "MaintenanceCorrective": ["maintenance corrective", "reparation"],
    "MaintenancePreventive": ["maintenance preventive", "entretien preventif"],
    "MaintenancePredictive": ["maintenance predictive"],
    "Incident": ["incident", "probleme", "anomalie", "defaut"],
    "Panne": ["panne", "defaillance"],
    "Alerte": ["alerte", "alarme", "avertissement"],
    "Surcharge": ["surcharge", "surtension"],
}

# Mots qui désignent une propriété de données. Plusieurs candidates possibles :
# on garde celle qui est réellement utilisée par la classe cible.
DATA_PROPERTY_SYNONYMS = {
    "puissance": ["puissanceKW", "puissanceMaxKW", "puissance"],
    "puissance installee": ["puissanceKW"],
    "puissance nominale": ["puissanceKW"],
    "puissance max": ["puissanceMaxKW"],
    "puissance maximale": ["puissanceMaxKW"],
    "capacite": ["capaciteKWh"],
    "capacite de stockage": ["capaciteKWh"],
    "energie stockee": ["energieStockeeKWh"],
    "niveau de charge": ["energieStockeeKWh"],
    "charge": ["energieStockeeKWh"],
    "tension": ["tensionKV"],
    "voltage": ["tensionKV"],
    "longueur": ["longueurKm"],
    "distance": ["longueurKm"],
    "surface": ["surfaceM2"],
    "superficie": ["surfaceM2"],
    "valeur": ["valeur"],
    "quantite": ["quantite", "valeur"],
    "date": ["dateOccurrence", "dateEvenement", "dateMesure", "dateInstallation"],
    "date d occurrence": ["dateOccurrence"],
    "date d installation": ["dateInstallation"],
    "date de mesure": ["dateMesure"],
    "gravite": ["gravite"],
    "severite": ["gravite"],
    "marque": ["marque"],
    "fabricant": ["marque"],
    "constructeur": ["marque"],
    "technologie": ["technologie"],
    "etat": ["etat"],
    "statut": ["etat"],
    "description": ["description"],
    "unite": ["unite"],
}

# Unité écrite après un nombre -> propriété correspondante
UNIT_PROPERTIES = {
    "kwh": ["capaciteKWh", "energieStockeeKWh", "valeur"],
    "mwh": ["capaciteKWh", "energieStockeeKWh", "valeur"],
    "kw": ["puissanceKW", "puissanceMaxKW"],
    "mw": ["puissanceKW", "puissanceMaxKW"],
    "kv": ["tensionKV"],
    "km": ["longueurKm"],
    "m2": ["surfaceM2"],
}
UNIT_FACTORS = {"mwh": 1000, "mw": 1000}

# Propriété numérique utilisée par défaut quand la question n'en cite aucune
DEFAULT_NUMERIC = [
    "puissanceKW", "capaciteKWh", "tensionKV", "valeur", "puissanceMaxKW",
    "energieStockeeKWh", "longueurKm", "surfaceM2",
]

# Colonnes affichées en priorité dans les tableaux de résultats
DISPLAY_PRIORITY = [
    "puissanceKW", "capaciteKWh", "energieStockeeKWh", "tensionKV", "longueurKm",
    "valeur", "unite", "gravite", "dateOccurrence", "dateEvenement", "dateMesure", "description",
    "marque", "technologie", "etat", "puissanceMaxKW", "surfaceM2", "dateInstallation",
]

# Propriétés textuelles dont on indexe les valeurs (ex. "Huawei" -> marque)
INDEXED_VALUE_PROPERTIES = {"marque", "technologie", "gravite", "etat"}

# Racines de mots (lemmes sans accents) qui orientent le choix d'une relation
OBJECT_PROPERTY_CUES = {
    "situeDans": ["situ", "trouv", "local", "implant", "ou"],
    "possede": ["possed", "equip", "dispos", "install"],
    "alimente": ["aliment", "fourn", "approvisionn"],
    "alimenteStockage": ["aliment", "charg", "rempl"],
    "affecte": ["affect", "touch", "impact", "concern"],
    "detectePar": ["detect", "signal", "repere"],
    "dessert": ["dessert", "desserv", "distribu"],
    "relie": ["reli", "connect", "raccord"],
    "contient": ["contien", "conten", "compos", "fait partie"],
    "concerne": ["concern", "port"],
    "porteSur": ["port", "intervention", "repar", "entreten"],
    "produitMesure": ["mesur", "enregistr", "produi"],
    "mesureePar": ["mesur", "capt"],
    "influenceProduction": ["influenc", "impact", "affect"],
    "occupe": ["occup", "habit"],
    "produitEnergie": ["produi", "gener"],
    "utiliseSource": ["utilis", "exploit", "source"],
}

# États : "en panne" = état déclaré OU incident de cette classe qui affecte l'élément
STATES = {
    "en panne": ("Panne", "En panne"),
    "hors service": ("Panne", "En panne"),
    "defaillant": ("Panne", "En panne"),
    "defectueux": ("Panne", "En panne"),
    "en surcharge": ("Surcharge", None),
    "en alerte": ("Alerte", None),
    "en maintenance": ("Maintenance", "Maintenance"),
    "avec incident": ("Incident", None),
    "avec un incident": ("Incident", None),
    "affecte par un incident": ("Incident", None),
    "en bon etat": (None, "Fonctionnel"),
    "fonctionnel": (None, "Fonctionnel"),
}
