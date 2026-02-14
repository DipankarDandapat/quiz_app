from src.main import app
from src.models.user import db
from flask_migrate import Migrate

migrate = Migrate(app, db)


#
# flask --app migrate.py db init        # Only once, to initialize
# flask --app migrate.py db migrate -m "Initial migration"
# flask --app migrate.py db upgrade     # Applies the migration