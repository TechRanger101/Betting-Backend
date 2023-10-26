#!/bin/sh

# npx schema-codegen pear/state/SpinState.ts --output ./pear/unity-classes/ --csharp && npx schema-codegen pear/entities/* --output ./pear/unity-classes/ --csharp

npx schema-codegen pear/state/SpinState.ts \
  --output ./pear/unity-classes/ \
  --csharp \
  --namespace FareProtocol.Schemas

npx schema-codegen pear/entities/* \
  --output ./pear/unity-classes/ \
  --csharp \
  --namespace FareProtocol.Schemas
