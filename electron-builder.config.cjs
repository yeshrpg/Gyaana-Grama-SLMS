module.exports = {
  appId: 'com.gyaanagrama.slms',
  productName: 'Gyaana Grama SLMS',
  directories: { output: 'release' },
  files: ['dist/**/*', 'dist-electron/**/*', 'db/**/*', 'assets/**/*'],
  win: {
    target: 'portable',
    icon: 'assets/icon.ico',
  },
  portable: {
    artifactName: 'GyaanaGrama-SLMS.exe',
  },
}
