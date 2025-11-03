import os
from sqlalchemy.engine import url as sa_url

from app.config import DATABASE_URL

u = sa_url.make_url(DATABASE_URL)
driver = u.drivername
print("driver:", driver)
print("url:", u.render_as_string(hide_password=True))