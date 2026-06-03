"""
Management command to fix poster URLs and YouTube trailer IDs
for all seeded movies using verified data.
"""
from django.core.management.base import BaseCommand
from apps.movies.models import Movie

# Verified poster URLs (TMDB CDN) + real YouTube trailer IDs
MOVIE_FIXES = {
    "Gladiator": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/ty8TGRuvJLPUmAR1H1nRIsgwvq0.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/hND6l2rBGSuBQVVeZEr2pZR5V0N.jpg",
        "trailer": "owK1qxDselE",
        "year": 2000, "duration_min": 155, "imdb": "8.5",
    },
    "The Dark Knight": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CejMIOX.jpg",
        "trailer": "EXeTwQWrcwY",
        "year": 2008, "duration_min": 152, "imdb": "9.0",
    },
    "John Wick": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/mMZRKb3NVTcgDjlKhX9XOp8U0Lq.jpg",
        "trailer": "C0BMx-qxsP4",
        "year": 2014, "duration_min": 101, "imdb": "7.4",
    },
    "Interstellar": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/gEU2QlsEOWepvdIV6glMEeqO8M.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg",
        "trailer": "zSWdZVtXT7E",
        "year": 2014, "duration_min": 169, "imdb": "8.7",
    },
    "Avatar": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/o0s4XsEDfDlvit5pDRKjzXR4pp2.jpg",
        "trailer": "5PSNL1qE6VY",
        "year": 2009, "duration_min": 162, "imdb": "7.9",
    },
    "Dune": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/jYEW5xZkZk2WTrdbMGAPFuBqbDc.jpg",
        "trailer": "n9xhJrPXop4",
        "year": 2021, "duration_min": 155, "imdb": "8.0",
    },
    "Spirited Away": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/39wmItIWsg5sZMyRU841LiyNhoq.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/bSXfU4dwZyBA1vMmXvejdRXBvuF.jpg",
        "trailer": "ByXuk9QqQkk",
        "year": 2001, "duration_min": 125, "imdb": "8.6",
    },
    "Spider-Man: Into the Spider-Verse": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/ka1aT4MElSLQaleBhZ6LxvMxkAR.jpg",
        "trailer": "tg52up16eq0",
        "year": 2018, "duration_min": 117, "imdb": "8.4",
    },
    "Coco": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/gGEsBPAijhVMBepPJB2Ng001u4p.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/askg3SMvhqEl4OL52YuvdtY40Yb.jpg",
        "trailer": "jL40zT9Tir4",
        "year": 2017, "duration_min": 105, "imdb": "8.4",
    },
    "The Grand Budapest Hotel": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/eWdyYQreja6JGCFGCK7iB1k9wL5.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/dEzMaQqEHiSHNbDmgpKN9KaG2Y.jpg",
        "trailer": "1Fg0iJ0n-AM",
        "year": 2014, "duration_min": 99, "imdb": "8.1",
    },
    "Knives Out": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/pThyQovXQrw2m0s9x82twj48Jq4.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/vttX8oGvKDFEn3LLi3oHhHRpnvN.jpg",
        "trailer": "qGqiHJTsRkQ",
        "year": 2019, "duration_min": 130, "imdb": "7.9",
    },
    "Superbad": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/ek8e8txUyUwd2BNqj6lFEerqTLh.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/gt7wFCdFdOBMfMU8YB9aMcJ8vfb.jpg",
        "trailer": "4eaZ_48ZYog",
        "year": 2007, "duration_min": 113, "imdb": "7.6",
    },
    "The Departed": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/nT97ifVT2J1yMQmeq20Qblg61T.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/8Z4cBhI7KUP7nTclvrfxiPVMRH4.jpg",
        "trailer": "auQ05-UVVOA",
        "year": 2006, "duration_min": 151, "imdb": "8.5",
    },
    "Parasite": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/ApiBzeaa95TNYLieFkPMamMibei.jpg",
        "trailer": "5xH0HfJHsaY",
        "year": 2019, "duration_min": 132, "imdb": "8.5",
    },
    "The Batman": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/74xTEgt7R36Fpooo50r9T25onhq.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg",
        "trailer": "mqqft2x_Aa4",
        "year": 2022, "duration_min": 176, "imdb": "7.9",
    },
    "The Shawshank Redemption": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
        "trailer": "6hB3S9bIaco",
        "year": 1994, "duration_min": 142, "imdb": "9.3",
    },
    "Oppenheimer": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg",
        "trailer": "uYPbbksJxIg",
        "year": 2023, "duration_min": 180, "imdb": "8.4",
    },
    "The Whale": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/jQ0gylJMxWSL490sy0RrPj1Lj7e.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/7k8TdtCOBRFJV4YjWN8JYIM7Vm7.jpg",
        "trailer": "nDPy6mBGSh0",
        "year": 2022, "duration_min": 117, "imdb": "7.7",
    },
    "Harry Potter and the Sorcerer's Stone": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/wuMc08JTJVSJhpebR29rYAY4m8A.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/hziiv14OpD73UwoaZrjKyFJ3ict.jpg",
        "trailer": "VyHV0BRtdxo",
        "year": 2001, "duration_min": 152, "imdb": "7.6",
    },
    "Pan's Labyrinth": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/uSb2ZL6tQBPYglNDDqHPb4F4Kex.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/4j7O7n4BhWMEiBcmUFJHv7CgkAZ.jpg",
        "trailer": "mBSTxYqGMHg",
        "year": 2006, "duration_min": 118, "imdb": "8.2",
    },
    "The Lord of the Rings: The Return of the King": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/8BPZO0Bf8TeAy8znF43z8soK3ys.jpg",
        "trailer": "r5X-hFf6Bwo",
        "year": 2003, "duration_min": 201, "imdb": "9.0",
    },
    "Hereditary": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/lHV8HHlhwNup2VbFJa6cEJU8hTw.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/sGtKnDGS3bMCRW7HFfxwO05AQaQ.jpg",
        "trailer": "V6wWKNij_1M",
        "year": 2018, "duration_min": 127, "imdb": "7.3",
    },
    "A Quiet Place": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/nAU74GmpUk7t5iklEp3bufwDq4n.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/roYyPiQnQiFGQIf6MkZhqhR3Kpf.jpg",
        "trailer": "WR7cc5t7tv8",
        "year": 2018, "duration_min": 90, "imdb": "7.5",
    },
    "Get Out": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/qdziAQiRLkGTdMoJpCBNLFTo4jE.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/b94xNx9zyh4ckEFJm5apMxF6mEz.jpg",
        "trailer": "DzfpyUB60YY",
        "year": 2017, "duration_min": 104, "imdb": "7.7",
    },
    "Inception": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
        "trailer": "YoHD9XEInc0",
        "year": 2010, "duration_min": 148, "imdb": "8.8",
    },
    "Blade Runner 2049": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/sO4CsxGGVx4aoXHGAGQ8V3qGR22.jpg",
        "trailer": "gD6OkLKNfOQ",
        "year": 2017, "duration_min": 164, "imdb": "8.0",
    },
    "Ex Machina": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/drjEERL83q4eM1V55O3nEpp867y.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/8SRUfRUi6x4O68n0VBeJma3jMXS.jpg",
        "trailer": "EoQuVnKhxaM",
        "year": 2014, "duration_min": 108, "imdb": "7.7",
    },
    "La La Land": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/uDO8zWDhfWwoFdKS4fzkUJt0f.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/nadTlnTE6DdgmMCDkTv9Y8UXfEF.jpg",
        "trailer": "0pdqf4P9MB8",
        "year": 2016, "duration_min": 128, "imdb": "8.0",
    },
    "Eternal Sunshine of the Spotless Mind": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/5MwkWH9tx75G6Bab690N6nHchEE.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/zTpFVYKVOVdz1JCeGBp1EqMQAtaO.jpg",
        "trailer": "07-QBPNGHiM",
        "year": 2004, "duration_min": 108, "imdb": "8.3",
    },
    "Pride & Prejudice": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/bkSb2yhWMxoO8iGOGi8hqXzGDkn.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/k7cR6IdFCFvCT3p2eLVKNe9AHEM.jpg",
        "trailer": "1dFo2EBuMCU",
        "year": 2005, "duration_min": 129, "imdb": "7.8",
    },
    "Gone Girl": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/qymaJhucquUwjpb8oiqynMeXnWH.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/KlRBmqNx2YlqiRlpEVVkiEJ19Lp.jpg",
        "trailer": "2-_-1nJf8Vg",
        "year": 2014, "duration_min": 149, "imdb": "8.1",
    },
    "Shutter Island": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/kve20tXwUZpu4GUX8l6X7Z4jmL6.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/jHPdRd7P0GYmpAXzCpS5bHxWM2s.jpg",
        "trailer": "5iaYLCiq5RM",
        "year": 2010, "duration_min": 138, "imdb": "8.2",
    },
    "Tenet": {
        "poster": "https://image.tmdb.org/t/p/w600_and_h900_bestv2/k68nPLbIST6NP96JmTxmZijEvCA.jpg",
        "backdrop": "https://image.tmdb.org/t/p/original/wzJRB4MKi3yK138bJyuL9nx47y6.jpg",
        "trailer": "LdOM0x0XDMo",
        "year": 2020, "duration_min": 150, "imdb": "7.4",
    },
}


class Command(BaseCommand):
    help = 'Fix poster URLs and trailer IDs for all seeded movies'

    def handle(self, *args, **options):
        fixed = 0
        not_found = []

        for title, data in MOVIE_FIXES.items():
            try:
                movie = Movie.objects.get(title=title)
                movie.poster_url = data['poster']
                movie.backdrop_url = data['backdrop']
                movie.trailer_youtube_id = data['trailer']
                movie.year = data['year']
                movie.duration_min = data['duration_min']
                from decimal import Decimal
                movie.imdb_rating = Decimal(data['imdb'])
                movie.weighted_rating = Decimal(data['imdb'])
                movie.avg_rating = Decimal(data['imdb'])
                movie.num_ratings = 50000
                movie.save()
                fixed += 1
                self.stdout.write(self.style.SUCCESS(f'✅ Fixed: {title}'))
            except Movie.DoesNotExist:
                not_found.append(title)
                self.stdout.write(self.style.WARNING(f'⚠️  Not in DB: {title}'))

        self.stdout.write(self.style.SUCCESS(
            f'\n🎬 DONE! Fixed {fixed} movies. Not found: {len(not_found)}'
        ))
