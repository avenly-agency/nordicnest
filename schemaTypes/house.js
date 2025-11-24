// nordicnest-cms/schemaTypes/house.js

import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'house', // To jest ID używane w kodzie (API)
  title: 'Domy i Biura', // To widzi użytkownik w panelu
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Nazwa modelu',
      type: 'string',
      validation: rule => rule.required()
    }),
    defineField({
      name: 'price',
      title: 'Cena (PLN)',
      type: 'number',
    }),
    defineField({
      name: 'mainImage',
      title: 'Zdjęcie główne',
      type: 'image',
      options: {
        hotspot: true, // Pozwala kkadrować zdjęcie w panelu
      },
    }),
    defineField({
      name: 'description',
      title: 'Krótki opis',
      type: 'text', // Dłuższy tekst
      rows: 3
    }),
    defineField({
      name: 'specs',
      title: 'Specyfikacja (punkty)',
      type: 'array',
      of: [{type: 'string'}] // Lista krótkich tekstów
    }),
  ],
})