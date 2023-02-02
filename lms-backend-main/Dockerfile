FROM python:3.9
WORKDIR /backend
COPY . .
RUN pip install --no-cache-dir -r requirements.txt

ENV SECRET_KEY="django-insecure-tl-gy%-w^z*@113k7lg0mpc6z_%m#*%+e0y(_a13o*i)*u20py"
ENV POSTGRES_PWD="CaprA4rEgEbRUtrIxAch"
ENV POSTGRES_HOST="3.111.73.127"
ENV API_KEY="pxo3_0CnRw6UwCaPRz1zsA"
ENV API_SEC="qOt6ErhMgoZQXaHaVQ4TsE812NyAXKxxU4Fb"
ENV ENCRYPTION_KEY="K125jgktQC-7Algihk0xO9MbrshfUx2-PTE-ztjHJIg="
ENV AWS_KEY="AKIAZCLTTESHN4SB4G4W"
ENV AWS_SEC="AQJRlgxbSDVbY4/8Vd1VXkvhgRC3/5iGug04A6YF"
ENV BUCKET_NAME="sambodhieducationnestss3"
ENV S3_LINK="https://lms-utilitie-bucket.s3.ap-south-1.amazonaws.com/"
ENV CC_AVENUE_WORKING_KEY="535058AF74A2062EC4AE963A63AC42E9"
ENV CC_AVENUE_MERCHANT_ID="9002"
ENV CC_AVENUE_ACCESS_CODE="FR5QELBW1ZCOKV2M"
ENV CC_AVENUE_REDIRECT_URL="https://www.educationnest.com/checkout"
ENV CC_AVENUE_CANCEL_URL="https://www.educationnest.com/checkout"
ENV TEXT_DECODE_SECRET_KEY='rHPbPJBI8ZeTGBZqrhX8yDDiFrAom9aTDui1omgX7hg='
ENV EMAIL_HOST_USER="lmsaiml24@gmail.com"
ENV EMAIL_HOST_PASSWORD="shpvznmaptwyryzl"

# RUN python3 manage.py makemigrations
# RUN python3 manage.py migrate

# RUN python3 manage.py makemigrations core_app
# RUN python3 manage.py migrate core_app

# RUN python3 manage.py makemigrations products
# RUN python3 manage.py migrate products

# RUN python3 manage.py makemigrations purchase
# RUN python3 manage.py migrate purchase

# RUN python3 manage.py makemigrations
# RUN python3 manage.py migrate

RUN python manage.py collectstatic --no-input
# Expose ports
EXPOSE 8000
# default command to execute    
#CMD ["python3", "manage.py", "runserver", "0.0.0.0:8001"] 
CMD exec gunicorn LMS.wsgi:application --bind 0.0.0.0:8000 --workers 3


