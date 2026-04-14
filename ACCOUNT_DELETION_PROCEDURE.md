# Procédure : Suppression de compte utilisateur (RGPD)

> Ce document décrit la séquence exacte à implémenter quand la fonction
> "Supprimer mon compte" sera développée dans Morpho.
> Elle n'est PAS encore implémentée. Ce document sert de référence pour
> l'implémentation future.

---

## Principes fondamentaux

- **Supabase est la seule source de vérité.** Aucune donnée n'est stockée ailleurs.
- La suppression est **irréversible** (point-in-time recovery Supabase conservé 7 jours côté infrastructure uniquement).
- La procédure doit être **traçable** dans `audit_log` AVANT que les données disparaissent.
- Le user doit confirmer **deux fois** avant exécution.

---

## Séquence exacte d'implémentation

### Étape 1 — Double confirmation côté frontend

```
[Bouton "Supprimer mon compte"] 
  → Modal 1 : "Êtes-vous sûr ? Cette action est irréversible."
    → Bouton "Confirmer"
      → Modal 2 : "Tapez DELETE pour confirmer la suppression définitive."
        → Champ texte libre → validation si input === 'DELETE'
          → Appel Edge Function `delete-account`
```

### Étape 2 — Edge Function `delete-account`

Créer `supabase/functions/delete-account/index.ts` avec la logique suivante
dans cet ordre strict :

```typescript
// 1. Vérifier l'authentification de l'utilisateur
//    (le user doit être connecté avec son propre compte)

// 2. Vérifier que user_id correspond bien au JWT (pas d'impersonation possible)

// 3. AUDIT LOG AVANT TOUTE SUPPRESSION
//    Insérer dans audit_log :
//    {
//      action: 'account_deletion_initiated',
//      actor_id: user.id,
//      actor_email: user.email,
//      target_user_id: user.id,
//      metadata: {
//        entries_count: <nombre d'entries>,
//        chat_messages_count: <nombre de messages>,
//        confirmed_at: new Date().toISOString(),
//        initiated_from_ip: request.headers.get('x-forwarded-for'),
//      }
//    }

// 4. Envoyer un email de notification à l'utilisateur
//    (via Supabase Auth ou Resend/SendGrid)
//    Sujet : "Votre compte Morpho a été supprimé"
//    Corps : confirmer la suppression, date, heure, IP source

// 5. Supprimer dans cet ordre (pour respecter les FK) :
//    a. memory_events          WHERE user_id = user.id
//    b. memory_snapshots       WHERE user_id = user.id
//    c. memory_compression_history WHERE user_id = user.id
//    d. user_memory            WHERE user_id = user.id
//    e. chat_messages          WHERE user_id = user.id
//    f. entries                WHERE user_id = user.id
//    g. audit_log              NE PAS SUPPRIMER (conserver la trace)
//    h. profiles               WHERE id = user.id
//       → cascade automatique si FK bien configurées

// 6. Supprimer le compte Supabase Auth
//    await supabaseAdmin.auth.admin.deleteUser(user.id)
//    → Ceci invalide toutes les sessions actives

// 7. Retourner { success: true } au frontend

// 8. Frontend : rediriger vers une page de confirmation "Compte supprimé"
//    et appeler supabase.auth.signOut()
```

### Étape 3 — Vérifications à faire avant implémentation

- [ ] S'assurer que toutes les tables enfants ont `ON DELETE CASCADE` vers `profiles(id)` ou `user_id` explicite
- [ ] Vérifier que `audit_log` N'a PAS de FK vers `profiles` (pour préserver la trace après suppression) ← déjà prévu dans la migration
- [ ] Tester la suppression sur un compte de test avant production
- [ ] Vérifier que Supabase PITR est bien activé (filet de sécurité ultime)

---

## Tables concernées par la suppression

| Table | Méthode | Raison |
|-------|---------|--------|
| `memory_events` | DELETE WHERE user_id | Pas de CASCADE sur profiles |
| `memory_snapshots` | DELETE WHERE user_id | Pas de CASCADE sur profiles |
| `memory_compression_history` | DELETE WHERE user_id | Pas de CASCADE sur profiles |
| `user_memory` | DELETE WHERE user_id | Pas de CASCADE sur profiles |
| `chat_messages` | DELETE WHERE user_id | Pas de CASCADE sur profiles |
| `entries` | DELETE WHERE user_id | Pas de CASCADE sur profiles |
| `profiles` | DELETE WHERE id | FK source |
| `audit_log` | **CONSERVER** | Traçabilité réglementaire |

> Note : Vérifier en base si des FK CASCADE existent déjà sur certaines tables.
> Si oui, la suppression de `profiles` peut déclencher automatiquement certaines suppressions.

---

## Considérations RGPD

- L'utilisateur a le **droit à l'effacement** (Art. 17 RGPD).
- La demande doit être traitée **sans délai injustifié** (max 30 jours).
- Conserver `audit_log` est légitime au titre de l'**intérêt légitime** pour la sécurité et la traçabilité (Art. 6(1)(f) RGPD), sans données personnelles sensibles.
- Si le user demande une **exportation de ses données** avant suppression (Art. 20 RGPD), prévoir un bouton "Exporter mes données" → JSON/CSV de ses entries + messages.

---

## Tests à effectuer avant mise en production

1. Créer un compte de test
2. Ajouter des entries, messages, mémoire
3. Lancer `delete-account` → vérifier que toutes les tables sont vides pour ce user
4. Vérifier que `audit_log` contient bien `account_deletion_initiated`
5. Vérifier que l'email de confirmation est reçu
6. Vérifier que le compte Auth est bien supprimé (plus de login possible)
7. Vérifier qu'aucune donnée résiduelle n'est accessible via l'API
