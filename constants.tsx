
import { Venue, Message, Booking } from './types';

export const MOCK_VENUES: Venue[] = [
  {
    id: '1',
    name: 'Salón Mirador El Cielo',
    location: 'Polanco, Ciudad de México',
    city: 'CDMX',
    price: 18500,
    rating: 4.9,
    reviewsCount: 124,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAcc0AT-19OgO_LSENQ5VqhvxTYF2b3I5fcTDYHqW-abjQ2COUjS3HqTbGuJuFPL0sLDReMgVvaIaWetWICMGhmbfnJ424ewBRlUQF13N8MJF9goGOaa9d21yTiwfEfowX_uh3XXhfLL4mWBoD3dlDvW318BBFhrlmHB0A2ZLw_-0aWz2yRF2bZpQimAXodN6bGrCYIhYYLTdfeuvkaEiYZFJcwZUacuvjiUNkJz3OdO8LgTfbpsIXqK_wkYwya8jc3Pj502364yQs',
    capacity: 150,
    size: 450,
    lat: 19.4326,
    lng: -99.1942,
    isFeatured: true,
    category: 'salones'
  },
  {
    id: '2',
    name: 'Terraza Urban',
    location: 'Centro, Madrid',
    city: 'Madrid',
    price: 170,
    rating: 4.8,
    reviewsCount: 89,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDl94eGEAeYTbcbC2-3mahtkvteGawSR_8mbQ8vPMAv4cXqu39p-ICIKvDJ3m9Ga9fKVv7zPmvNg_HeYJHDI5nVUTM-kQXRBRSL9yl9F264cYt1GT9np0eeJKPmGLmcUAJos56jChUfYjU1V1wd2ce3PwS0QnmlqM477t1WtZc_hdqMFRB_SkIurTuX83z68GWsivLZAsmEN19sfgtYL6lqRU9PjkO9Ux0oa3Ee5G7W1-nEYgUYAUTRHtg023xhd3kBhqVVQJAD8a4x',
    capacity: 80,
    size: 200,
    lat: 40.4168,
    lng: -3.7038,
    discount: '-15% hoy',
    category: 'fiestas'
  },
  {
    id: '3',
    name: 'Loft Creativo',
    location: 'Bilbao',
    city: 'Bilbao',
    price: 7500,
    rating: 4.6,
    reviewsCount: 45,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBJqOiPdshXk5hrnB8wdw2_eS0pQmmaq9dEUXQyyVHyQ1vbpxsX7_S0earK5_WHoA5Bk7KrGdXt9munqeWsKDP7jQTLtv3L2XDJ3qEITuebkibcUv_Ve25qWI7HR37KS7R2vP2Xk9_0UK8ADSZLAOhx_YQihjMpsmN3gi4_uY722DBWSnfS-2H0n15NnmY57Dwg-MIifenVVxUmXenVrtPjSp3jFyZOi5ib5jjo39nlKOGVTAG17oCq-x4LLJIkOiB_UdH2Rq9B7OG',
    capacity: 50,
    size: 120,
    lat: 43.2630,
    lng: -2.9350,
    isNew: true,
    category: 'reuniones'
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    sender: 'Carlos Mendoza',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1Q9_4K3JMdfa7C-JJXNokrLGEyKANLbF0ke4-UM7TDUBK6Eh_GEavy4knr5MmgdZf6BnUe-R-0up2qIqWky1ZpmWUU8HdpjF3Ooa_DruMXL6az6nkl8dPS48YinKIYc2Y27A6TE09wUMeoXLnmLQPAOHK9aAUSlceT3nnVHAhITIbDh0ch_QlBs1YkCe6ybTcZRo_CE8C9X3qzGVD9OkPQJHS6neUiZHlCXx4pa7k5MlVP3L-j7Yyz9TRxG4gd5Jp7-0aRTfkD0oU',
    content: 'Sí, el salón estará disponible ese día.',
    time: '10:24',
    venueName: 'Salón Mirador Urbano',
    unreadCount: 2,
    isOnline: true
  },
  {
    id: '2',
    sender: 'Laura Gómez',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgNVCclbhTGkW4WWNJ0VdQzDiXz-qxcto_SCtL83M8jzLrvqm-tNh42UKKZyANZQq37n0NYU3ubI4kwB6VKzzA1TMj9tQXRhkO8OFK-8_SduPUIJRER5h1vMebdyl3ovtNF0rNqnf-HZxfU1RgsIeVBntmYGqPZDZc3Dnn0wfMVioeTmcfgKjRiUtJwrcKVpsvOIPuxdWXyucfCChEobwVb7CLo4oMnJfIlnRD_whdeZKGb-KeWs73_8dW1HBlbnQycbAseLRxpz58',
    content: 'Gracias por tu consulta sobre el servicio',
    time: 'Ayer',
    venueName: 'Jardín El Paraíso',
    isOnline: false
  },
  {
    id: '3',
    sender: 'Martín Rodríguez',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDujIZQtJgFF5DvZxvXet-ezjGO_kA0E6TsTRTNWh0is8le3FLWD-4oSuIg4q0OT54NR0nJXpr8FUvgkTjF5OW8gP7xYF6kSt7DjvmmGAk9vh8qUPen1BqfeXcPHtFeMeqWmIkeuoA7hJVeI8S8j8aBtGnLHdvM4-muzzcyEXBHHUtdE3DVLK0yeYqh9VpQRvbLMTZA1Fg-vrRQnWJOHQkjZXxa4lEHaoqjyRzmMgC3BcbhFlymHg6sp8UgYU-VgHJuwfg9gRxOQh0I',
    content: 'Hola, te confirmo que hemos recibido el pago',
    time: '23/07',
    venueName: 'Loft Industrial',
    isOnline: false
  }
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: '1',
    venueName: 'Salón Mirador Urbano',
    location: 'Palermo, Buenos Aires',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA_l2KK065syYdu-KRUTPSYQZEbZxwkB5-PKzE8qyfVCQ0ZYt9LQV8X5PxybDBA6H9-6e_Ir5UjQqjZ8hS-nmtpT0wCENNcsu3SDBtzPZ3YL_GTdclF9GfEr4JM6k8ylP8UMjoJTnG5iVYEYNjIAHIsroFRE7t88Lcnpk3CoPibDAGY-Q4Vev-prCHRJ7DhF0pwMs_82TW3sAT17DpMa4GY87GJzVPS1oq2B7XkFh9y8padFyQJIMBZAWGmen_zs8lbgFiQNKzc0bGe',
    date: '12 de Agosto, 2023',
    time: '19:00 - 00:00',
    totalPrice: 145200,
    status: 'Confirmada',
    statusColor: '#00B4BB'
  },
  {
    id: '2',
    venueName: 'Jardín del Bosque',
    location: 'Pilar, Buenos Aires',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMowTXFSnR-E-v3W-_vfEVYt2adFrB3saKMeaGBS9Oodibg45PSBT1sFX4yg1NAVrCS5LmNYMs1dQf_RJqUYsiO0yYZFzE2ST_I4tWAJC9RDEgN-GPfqvACIHM8k0mPC7JFBXQIIMVL82WwxtKjOP1JlfCcAhf1c2I8FWScPte3d2EXJQVc7o7SArESQLiZfE4VpMgo3pxV3Z0UAdJnTQYiGUcambTXeH5gL7FOgA0ek7lGSINiEOvYz5aL-J7f-DLVYBfOougY4ps',
    date: '24 de Septiembre, 2023',
    time: '12:00 - 18:00',
    totalPrice: 178500,
    status: 'Pendiente',
    statusColor: '#F6A623'
  },
  {
    id: '3',
    venueName: 'Terraza Panorámica',
    location: 'Puerto Madero, Buenos Aires',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIzdFu2N1hF6ShaaGaEG2Q9DydnCgrtI-ZgHbFvlAwAOCg9ub_otjuhIp4I6lRebBdqv9AMOa8KIBQQEt9vX_EiU0HBR98PeCjEDk4dBxEjOhe9sCUV5mq5Um5QeNanAVZvCSzJ3oqPLxPLXr4PF5dse-mExJHH2aaIBJrM8kFMX1ZJ0xNILRccfTOCUEmOVhZhVfxWFda_S6ehLAXYaGknbY-828YiO2xhGWb251xYhpiNlqpLf17Kaehso7hy-zZVjfEQ1_eDV0U',
    date: '15 de Octubre, 2023',
    time: '20:00 - 02:00',
    totalPrice: 210000,
    status: 'Confirmada',
    statusColor: '#00B4BB'
  }
];
