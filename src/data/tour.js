// Read time excludes camera travel; content stays independent of UI state.
export const tour = [
  ['sun', 'Matahari', 'Mulai dari bintang kita. Fusi hidrogen di inti menyediakan energi yang akhirnya mencapai Bumi sebagai cahaya.', 12000, 5.2],
  ['mercury', 'Merkurius', 'Permukaan berkawah ini hampir tanpa atmosfer. Rotasinya lambat, sehingga siang dan malam mengalami perbedaan suhu ekstrem.', 12000, 5.2],
  ['venus', 'Venus', 'Awan menutupi permukaan Venus. Atmosfer karbon dioksida yang tebal memerangkap panas melalui efek rumah kaca.', 12000, 5.2],
  ['earth', 'Bumi dan Bulan', 'Lautan menutupi sebagian besar Bumi. Bulan mengorbit planet kita dan membantu menghasilkan pasang surut. Cari Bulan melalui pencarian untuk melihat lebih dekat.', 16000, 8],
  ['mars', 'Mars', 'Warna merah berasal dari mineral besi yang teroksidasi. Jejak lembah dan delta menunjukkan air pernah mengalir di permukaannya.', 12000, 5.2],
  ['asteroid-belt', 'Sabuk asteroid', 'Di antara Mars dan Jupiter, banyak benda berbatu mengorbit Matahari. Partikel di sini mewakili sabuk secara ilustratif; ruang antarbenda sesungguhnya sangat luas.', 14000, 5],
  ['jupiter', 'Jupiter dan bulan Galilea', 'Amati Io, Europa, Ganymede, dan Callisto di sekitar raksasa gas. Keempatnya ditemukan melalui pengamatan teleskop Galileo pada 1610.', 16000, 8],
  ['saturn', 'Saturnus dan cincinnya', 'Cincin ini tersusun terutama dari partikel es dengan berbagai ukuran. Celah dan pita kerapatannya membentuk pola yang terlihat dari jauh.', 14000, 6.5],
  ['uranus', 'Uranus', 'Sumbu Uranus miring hampir menyamping. Metana di atmosfer menyerap cahaya merah dan memberi planet ini warna biru kehijauan.', 12000, 5.2],
  ['neptune', 'Neptunus', 'Perjalanan berakhir pada planet utama terluar. Neptunus memiliki angin sangat kencang; Triton mengorbit berlawanan arah dengan rotasi planet.', 14000, 6],
].map(([id, title, narration, duration, framing]) => ({ id, title, narration, duration, framing }));
