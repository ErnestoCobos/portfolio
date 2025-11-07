# Conventional Commits

Este proyecto usa [Conventional Commits](https://www.conventionalcommits.org/) para mantener un historial de commits limpio y consistente.

## Formato

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Tipos permitidos

- **feat**: Nueva funcionalidad
- **fix**: Corrección de bugs
- **docs**: Cambios en documentación
- **style**: Cambios de formato (espacios, puntos y comas, etc)
- **refactor**: Refactorización de código
- **perf**: Mejoras de performance
- **test**: Añadir o modificar tests
- **build**: Cambios en el sistema de build
- **ci**: Cambios en CI/CD
- **chore**: Tareas de mantenimiento
- **revert**: Revertir commits anteriores

## Ejemplos

```bash
feat(auth): add login functionality
fix(api): resolve null pointer exception
docs(readme): update installation instructions
style(button): format code with prettier
refactor(utils): simplify date parsing logic
```

## Hooks configurados

- **pre-commit**: Ejecuta lint-staged (ESLint + Prettier)
- **commit-msg**: Valida que el mensaje siga conventional commits
