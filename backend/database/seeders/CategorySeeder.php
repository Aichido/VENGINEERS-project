<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Écrans tactiles', 'slug' => 'ecrans-tactiles'],
            ['name' => 'Vidéoprojecteurs', 'slug' => 'videoprojecteurs'],
            ['name' => 'Ordinateurs portables', 'slug' => 'ordinateurs-portables'],
            ['name' => 'Solutions réseau', 'slug' => 'solutions-reseau'],
            ['name' => 'Serveurs & stockage', 'slug' => 'serveurs-stockage'],
            ['name' => 'Périphériques & accessoires', 'slug' => 'peripheriques-accessoires'],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}