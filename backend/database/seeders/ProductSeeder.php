<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $ecrans = Category::where('slug', 'ecrans-tactiles')->first()->id;
        $video = Category::where('slug', 'videoprojecteurs')->first()->id;
        $laptops = Category::where('slug', 'ordinateurs-portables')->first()->id;
        $reseau = Category::where('slug', 'solutions-reseau')->first()->id;
        $serveurs = Category::where('slug', 'serveurs-stockage')->first()->id;
        $peripheriques = Category::where('slug', 'peripheriques-accessoires')->first()->id;

        $products = [
            // Écrans tactiles
            [
                'name' => 'Écran tactile interactif 65"',
                'description' => "Écran tactile interactif 65 pouces, résolution 4K UHD, technologie multi-touch jusqu'à 20 points de contact. Idéal pour salles de réunion et espaces collaboratifs. Compatible Windows, Android intégré, connectique HDMI/USB-C/RJ45.",
                'price' => 2450.00,
                'stock_qty' => 8,
                'category_id' => $ecrans,
                'is_active' => true,
            ],
            [
                'name' => 'Écran tactile interactif 75"',
                'description' => "Grand format 75 pouces pour amphithéâtres et salles de conférence. Dalle anti-reflet, stylet inclus, système audio intégré 2x15W.",
                'price' => 3200.00,
                'stock_qty' => 5,
                'category_id' => $ecrans,
                'is_active' => true,
            ],
            [
                'name' => 'Écran tactile portable 32"',
                'description' => "Écran tactile mobile sur pied à roulettes, idéal pour présentations itinérantes et petites équipes.",
                'price' => 890.00,
                'stock_qty' => 12,
                'category_id' => $ecrans,
                'is_active' => true,
            ],
            [
                'name' => 'Écran tactile ancien modèle 55"',
                'description' => "Modèle précédente génération, encore fonctionnel mais retiré du catalogue actif.",
                'price' => 1200.00,
                'stock_qty' => 0,
                'category_id' => $ecrans,
                'is_active' => false,
            ],

            // Vidéoprojecteurs
            [
                'name' => 'Vidéoprojecteur Full HD 5000 lumens',
                'description' => "Projecteur professionnel Full HD, luminosité 5000 lumens, idéal pour salles éclairées. Double connectique HDMI, correction trapèze automatique.",
                'price' => 780.00,
                'stock_qty' => 15,
                'category_id' => $video,
                'is_active' => true,
            ],
            [
                'name' => 'Vidéoprojecteur laser 4K',
                'description' => "Technologie laser longue durée (20 000h), résolution 4K native, contraste élevé pour rendu professionnel en environnement lumineux.",
                'price' => 2100.00,
                'stock_qty' => 6,
                'category_id' => $video,
                'is_active' => true,
            ],
            [
                'name' => 'Vidéoprojecteur portable compact',
                'description' => "Format ultra-compact et léger, parfait pour déplacements et petites réunions. Batterie intégrée 3h d'autonomie.",
                'price' => 420.00,
                'stock_qty' => 20,
                'category_id' => $video,
                'is_active' => true,
            ],

            // Ordinateurs portables
            [
                'name' => 'Laptop Pro 15" i7 16Go',
                'description' => "Ordinateur portable professionnel, processeur Intel i7 12e génération, 16Go RAM, SSD 512Go, écran 15.6\" Full HD. Idéal pour techniciens en déplacement.",
                'price' => 1150.00,
                'stock_qty' => 10,
                'category_id' => $laptops,
                'is_active' => true,
            ],
            [
                'name' => 'Laptop Business 14" i5 8Go',
                'description' => "Modèle compact et léger pour usage bureautique quotidien. Processeur i5, 8Go RAM, SSD 256Go, autonomie 10h.",
                'price' => 720.00,
                'stock_qty' => 18,
                'category_id' => $laptops,
                'is_active' => true,
            ],
            [
                'name' => 'Laptop Workstation 17" i9 32Go',
                'description' => "Station de travail mobile haute performance, processeur i9, 32Go RAM, carte graphique dédiée, SSD 1To. Pour tâches lourdes (CAO, rendu 3D).",
                'price' => 2350.00,
                'stock_qty' => 4,
                'category_id' => $laptops,
                'is_active' => true,
            ],

            // Solutions réseau
            [
                'name' => 'Routeur professionnel Gigabit',
                'description' => "Routeur d'entreprise, débit Gigabit, gestion VLAN, VPN intégré, QoS avancée pour environnements multi-utilisateurs.",
                'price' => 340.00,
                'stock_qty' => 25,
                'category_id' => $reseau,
                'is_active' => true,
            ],
            [
                'name' => 'Switch réseau 24 ports PoE',
                'description' => "Switch administrable 24 ports avec alimentation PoE, idéal pour déploiement de caméras IP et points d'accès Wi-Fi.",
                'price' => 590.00,
                'stock_qty' => 14,
                'category_id' => $reseau,
                'is_active' => true,
            ],
            [
                'name' => 'Point d\'accès Wi-Fi 6 professionnel',
                'description' => "Borne Wi-Fi 6 haute densité, couverture jusqu'à 300m², gestion centralisée cloud incluse.",
                'price' => 275.00,
                'stock_qty' => 22,
                'category_id' => $reseau,
                'is_active' => true,
            ],
            [
                'name' => 'Pare-feu réseau entreprise',
                'description' => "Firewall matériel avec inspection de paquets approfondie, protection contre intrusions, licences de sécurité incluses la première année.",
                'price' => 1450.00,
                'stock_qty' => 7,
                'category_id' => $reseau,
                'is_active' => true,
            ],

            // Serveurs & stockage
            [
                'name' => 'Serveur rack 1U entrée de gamme',
                'description' => "Serveur rack 1U, processeur Xeon, 32Go RAM, 2x SSD 480Go en RAID 1. Idéal pour PME.",
                'price' => 2800.00,
                'stock_qty' => 5,
                'category_id' => $serveurs,
                'is_active' => true,
            ],
            [
                'name' => 'NAS 8 baies stockage réseau',
                'description' => "Solution de stockage réseau 8 baies, capacité extensible jusqu'à 96To, sauvegarde automatisée et accès distant sécurisé.",
                'price' => 1650.00,
                'stock_qty' => 9,
                'category_id' => $serveurs,
                'is_active' => true,
            ],
            [
                'name' => 'Onduleur pour baie serveur 3000VA',
                'description' => "Onduleur professionnel 3000VA, autonomie 15 min à pleine charge, gestion à distance via SNMP.",
                'price' => 980.00,
                'stock_qty' => 11,
                'category_id' => $serveurs,
                'is_active' => true,
            ],

            // Périphériques & accessoires
            [
                'name' => 'Stylet pour écran interactif',
                'description' => "Stylet de remplacement compatible avec toute la gamme d'écrans tactiles interactifs Vengineers.",
                'price' => 45.00,
                'stock_qty' => 40,
                'category_id' => $peripheriques,
                'is_active' => true,
            ],
            [
                'name' => 'Support mural pour écran tactile',
                'description' => "Support mural réglable, compatible écrans 55\" à 75\", inclinaison ajustable pour un confort d'utilisation optimal.",
                'price' => 180.00,
                'stock_qty' => 16,
                'category_id' => $peripheriques,
                'is_active' => true,
            ],
            [
                'name' => 'Webcam conférence 4K',
                'description' => "Webcam professionnelle 4K avec micro intégré, angle de vue 120°, idéale pour visioconférences en salle de réunion.",
                'price' => 210.00,
                'stock_qty' => 13,
                'category_id' => $peripheriques,
                'is_active' => true,
            ],
            [
                'name' => 'Ancien modèle de support mural',
                'description' => "Support mural fixe, ancienne génération, retiré du catalogue actif.",
                'price' => 90.00,
                'stock_qty' => 0,
                'category_id' => $peripheriques,
                'is_active' => false,
            ],
        ];

            foreach ($products as $productData) {
            $product = Product::create($productData);

            // 2 images placeholder par produit, la première marquée comme principale
            for ($i = 0; $i < 2; $i++) {
                $seed = $product->id . '-' . $i;

                ProductImage::create([
                    'product_id' => $product->id,
                    'path' => "https://picsum.photos/seed/{$seed}/800/600",
                    'thumbnail_path' => "https://picsum.photos/seed/{$seed}/200/150",
                    'position' => $i,
                    'is_primary' => $i === 0,
                ]);
            }
        }
    }
}