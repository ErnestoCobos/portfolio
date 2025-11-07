module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // Nueva funcionalidad
        'fix', // Corrección de bugs
        'docs', // Documentación
        'style', // Formato, puntos y comas, etc
        'refactor', // Refactorización de código
        'perf', // Mejoras de performance
        'test', // Tests
        'build', // Cambios en el build
        'ci', // Cambios en CI
        'chore', // Tareas de mantenimiento
        'revert', // Revertir commits
      ],
    ],
  },
};
