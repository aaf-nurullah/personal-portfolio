#!/bin/bash

# Define directories
INPUT_DIR="images"
OUTPUT_DIR="$INPUT_DIR/webp"

# Create WebP directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Loop through all PNG and JPG files in images directory
find "$INPUT_DIR" -maxdepth 1 -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) | while read -r file; do
  filename=$(basename -- "$file")
  name="${filename%.*}"

  # Convert to WebP with 80% quality
  magick convert "$file" -resize "800x800>" -quality 80 "$OUTPUT_DIR/$name.webp"

  # Optimize original (overwrite)
  magick convert "$file" -resize "800x800>" -quality 80 "$file"

  echo "✔️ Optimized: $filename"
done

echo "All images have been optimized!"
