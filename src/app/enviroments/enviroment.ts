export const environment = {
  production: false,
  api: {
    //hoteles: 'http://3.150.124.131/api/hotel',
    //hoteles: 'http://localhost:8082',
    //habitaciones: 'http://localhost:8082', // o el puerto real de tu microservicio
    
    //restaurantes: 'http://localhost:8083',
    hoteles: 'http://3.150.124.131/api/hotel',
    habitaciones: 'http://3.150.124.131/api/hotel',
    restaurantes: 'http://3.150.124.131/api/rest/',
    reviews: 'http://3.150.124.131/api/reviews/',
    user: 'http://3.150.124.131/api/user/',
    reportes: 'http://3.150.124.131/api/reportes/',
  }
};