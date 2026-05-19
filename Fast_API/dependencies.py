from models import db
from sqlalchemy.orm import sessionmaker

Session = sessionmaker(bind=db)

def pegar_sessao():
    session = Session()
    try:
        yield session
    except:
        session.rollback()
        raise
    finally:
        session.close()