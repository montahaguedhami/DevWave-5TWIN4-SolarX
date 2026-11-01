"""Module IA : traduction d'une question en français vers une requête SPARQL.

Chaîne de traitement (voir pipeline.py) :
  1. analyse linguistique   -> spaCy (fr_core_news_sm) : tokens, lemmes, catégories
  2. entités de l'ontologie -> lexique construit depuis Fuseki + RapidFuzz (fautes de frappe)
  3. intention              -> sentence-transformers (Hugging Face) + règles
  4. génération SPARQL      -> chemins trouvés dans le schéma de l'ontologie
  5. exécution              -> Fuseki, puis réponse rédigée en français
"""
