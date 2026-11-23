#!/bin/sh
# Gradle start up script for POSIX shells.

set -eu

APP_HOME=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
APP_NAME="Gradle"
APP_BASE_NAME=${0##*/}

# Determine Java command
if [ -n "${JAVA_HOME:-}" ]; then
  JAVACMD="$JAVA_HOME/bin/java"
else
  JAVACMD="java"
fi

# Verify Gradle Wrapper JAR exists
GRADLE_WRAPPER_JAR="$APP_HOME/gradle/wrapper/gradle-wrapper.jar"
if [ ! -r "$GRADLE_WRAPPER_JAR" ]; then
  echo "Error: Could not find or read $GRADLE_WRAPPER_JAR" >&2
  exit 1
fi

exec "$JAVACMD" -classpath "$GRADLE_WRAPPER_JAR" org.gradle.wrapper.GradleWrapperMain "$@"
