# Recursos visuales

La presentación y los paneles actuales son SVG creados para jhus, inspirados en las referencias que aportó el usuario. La tipografía sigue la familia de sistema de la plantilla Classic de [Metrics](https://github.com/lowlighter/metrics/blob/master/source/templates/classic/style.css): Segoe UI en Windows y sus alternativas de sistema. El retrato ASCII conserva una fuente monoespaciada para mantener su forma. No se distribuyen archivos de fuentes de Microsoft.

- El avatar ASCII deriva del avatar público del usuario, con su autorización.
- Los iconos de tecnologías proceden de [Devicon](https://github.com/devicons/devicon), con licencia MIT incluida en DEVICON-LICENSE.txt. Apple y Rust se adaptaron para fondo oscuro.
- Las imágenes y datos de los juegos se obtienen del [perfil público de Steam de jhus](https://steamcommunity.com/id/iamjhus/). Los títulos, imágenes y marcas pertenecen a sus titulares.
- El enlace musical corresponde al [perfil de Apple Music proporcionado por el usuario](https://music.apple.com/profile/jhus). No se inventa historial de escucha cuando no está disponible públicamente.
- Las estadísticas y calendarios incluyen únicamente la información pública de GitHub. Las contribuciones no equivalen a commits ni representan toda la experiencia profesional del usuario.

El flujo Actualizar perfil ejecuta .github/profile-widgets.mjs diariamente y de forma manual. Usa el token temporal de GitHub Actions para su propio repositorio; no necesita METRICS_TOKEN ni claves de Steam. Si Steam falla, conserva el último panel válido y su fecha visible. El script no registra secretos ni publica datos de repositorios privados.

Los recursos de diseños anteriores permanecen en el historial y en assets/: Space Grotesk (SIL OFL 1.1, licencia incluida), gráficos anteriores y preparación anterior de Metrics.
