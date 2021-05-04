cd $( dirname . )
docker run --rm --name oliver -v $( pwd )/:/usr/local/apache2/htdocs/ -p 81:80 httpd
