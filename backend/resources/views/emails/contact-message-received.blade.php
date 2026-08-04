<x-mail::message>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
<tr>
<td style="background-color: #000000; padding: 20px 24px; border-radius: 4px 4px 0 0;">
<span style="color: #ECB115; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">VENGINEERS</span>
</td>
</tr>
<tr>
<td style="background-color: #F80000; height: 4px; line-height: 4px; font-size: 0;">&nbsp;</td>
</tr>
</table>

# Nouveau message de contact

Un visiteur vient de soumettre le formulaire de contact du site.

<table width="100%" cellpadding="8" cellspacing="0" style="background-color: #F7F7F7; border-radius: 4px; margin: 16px 0;">
<tr>
<td style="color: #707070; font-size: 13px; width: 100px;">Nom</td>
<td style="color: #000000; font-size: 14px; font-weight: bold;">{{ $contactMessage->name }}</td>
</tr>
<tr>
<td style="color: #707070; font-size: 13px;">Email</td>
<td style="color: #000000; font-size: 14px;">{{ $contactMessage->email }}</td>
</tr>
<tr>
<td style="color: #707070; font-size: 13px;">Sujet</td>
<td style="color: #000000; font-size: 14px;">{{ $contactMessage->subject }}</td>
</tr>
</table>

**Message :**

<table width="100%" cellpadding="12" cellspacing="0" style="background-color: #ffffff; border-left: 4px solid #C62221; margin: 12px 0 24px;">
<tr>
<td style="color: #404040; font-size: 14px; line-height: 1.6;">{{ $contactMessage->message }}</td>
</tr>
</table>

<x-mail::button :url="'mailto:' . $contactMessage->email" color="error">
Répondre au client
</x-mail::button>

Ce message a été envoyé automatiquement depuis le formulaire de contact du site Vengineers.

{{ config('app.name') }}
</x-mail::message>