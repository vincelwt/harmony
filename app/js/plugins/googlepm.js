var PlayMusic = require('playmusic'),
  	pm = new PlayMusic();

////////////////////////////////
////////////////////////////////
////////////////////////////////
////////////////////////////////


var googlepm = exports;

googlepm.discover = false;
googlepm.mymusic = true;
googlepm.playlists = true;

googlepm.favsLocation = "googlepm,playlists,favs";

googlepm.scrobbling = true;
googlepm.color = "#ef6c00";

googlepm.loginBtnHtml = `

    <a id='btn_googlepm2' class='button login googlepm hide' onclick="logout('googlepm')"></a>
    <a id='btn_googlepm' class='button login googlepm hide'><span>Listen with <b>Play Music</b></span>
      <br>
      <div style='margin-left:-40px;width: 220px'>
        <div class='form-group'>
          <input id='googlepmUser' type='text' class='form-control' placeholder='Email'>
          <br/>
          <input id='googlepmPasswd' type='password' class='form-control' placeholder='Password'>
          <br/>
          <button onclick="login('googlepm')" class='btn btn-primary'>Save</button>
        </div>
      </div>
    </a>
    <span id='error_googlepm' class='error hide'>Error, please check your credentials</span>
`;

googlepm.loginBtnCss = `
	.googlepm {
	  background-color: #ef6c00;
	  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAP0AAAD9CAYAAAB3NXH8AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAABXOAAAVzgG79UFSAAAAB3RJTUUH4AIGDhY2XIew2gAAIABJREFUeNrtnXl0FVW2xr9T0x0TkhBIwjxpCKMYcAAE0SDYKogKoqJ2K8pTaW19Tt32s3u99rXyulHs7qeCs7agoI0DKoJjAwJKmOcxQAghZAByk5s7VJ33RwABIeTeukOdW/tby0XWkqFq1/6db+9Tp85hNZNBElzMmz2buVuOlTwtwU79T1bBnOmNv1F1gqmuk/4sDweAYH3jzwEfoIdg1FWB11WB1x/9ta4KRl1VDfcdzALnFHDBpVAIRHhKDsi5PbjU+hxIWZ0a/2t57NfOYKozEVeRiXCAGzV7YFSVwKgugVG1C0ZVCfTK7TD2b2D86OBBsrhJkNNbS1KLNlxu1w9ym96Q2vaF3KY35Jx8QLL4+MwNGJU7oO9bA71sHfR9a6GXroZRXcLoqRL0pOOEy5BzunO5fSGULoMgdx0MObdHSt2icaQc+p4VCO9cDH3nEoR3/8gQDtCzJ+htxHnrfK72GAmlYASULoN+6rdtIh6sh16yDKHNCxDeOB/6vjVUCRD0KRZgzQPl3GFc6XEl1IKRkLK7UFBOrAQOlyG8aT5CGz5HeMuXXbn/0E6KCkEvnlQn1PzhXO03FmrfMWAOL8WkWSOAjnDJMoRWzUFwxTtzuK9yHAWFoLduIFUXlB5Xcu38cVB6XQ2meSgoZhQOILR5AULF7yG07mPGA7UUE4LeGpJzC7h2we3QBk4E87SkgMRjHiDUgPD6TxBYMgPhrV8xWitA0CenfO91DXcMuhtKfhHFI5EdQMUWBJa9juDS14q572B/ighBH1dJ2V24Y9iD0C68HcyRRgFJcvkfLH4XgW+ehb5vLb0BIOhjXMK3L+SOSx+A1v8m6y+SsSP/O5cgsHAKQhvmUelP0JuJDIPaezR3FD0CpfNAiocA0vetReDrqQiumMlghCkgBH3zpeQXcdfoZyC3L6RgiNj3V5egYcHTCC59lcHQKSAE/Vlgv+Z/IHe8gIKRCs5fvgmBhc8guOIdgp+gPwX2zgO5c/QUKF0HUzBStOxv+OS3CG34jCb87A69lNGWO695GtqACQCjfEh1hbd8Bf8Hv4G+fz0j6O1205ob2tBfc+eI39MSWds1/GEEl74G/7wnbLvM13bQq/3GcteYqZAy2xMANhb3VcI/7/cIfj/Ddq/5bAO9lJ7HXWP/DvW86ynjST+V/DuXwD/rLujlmxhBnzJ3yKANuJW7rn8OzJ1FWU76ufQQAl8/C/+nTzLoQYJeaHdvnc/dN79Cs/Kk5rFftg71MydC3/0DI+gFlHbBbdx14wv0iSspMhlhBL6aCv+n/8Wghwh6IW7I22qF++ZXCtXeoyiBSdG7fsly1L01AcbB7Yygt7CU7sO5e8IbkFq0oawlmRZvOAL/h48guGRGSoEvpcZdKHBd9yz33vsFAU+KnSM60+EePx3u297mTHMT9FYq5733zueOYQ/SqjpSXKQNmADvo8VczumeEi/0hS7v5Q79uWfiB5AyO1BmkhJS7tf/85cIrZkrtLsI6/TaoLt52kNLCHhSQst9z50fwDXqGQ4mEfSJ7N/d41/i7vHTAVmjTCQlmHwGx/DH4Jn4gbB9vlDQM4cXnrs/5NqgSZR8pKRK7XMtvPd/y1laDifo43WhLdpw7wPfcbXnVZRxJEtI7jgAaQ8vg5xbwAn6WAe3TW/u/c+lkNufT5lGshZAWZ3gfXAJlHOGcYI+RlK6DubeBxfThB3Jum2nOxPeez+H2ncMJ+jNAn/Opdxzz+e2O9mVJKAUBzx3zIF24e2coI9Sas+rGoGnnW1IwtTNMty3vA7H0F9zgj5S4M8fxz13zQVTnZRIJMFqfQbX9c/DcdlDnKBvprTCm7jn9pmArFICkcQFf8xUOC5/hBP0Z3P4PqO5+9Y3AUmmxCEJL9foKXBcci8n6M8gJb+Iu3/5Ljk8KbUcf+w/oA2cyAn6U4HvPJB77v6QenhSSoLvvvElaIXjLQN+0o9glTv055775tO2VmakB2FU74ZRvQdGTeOv3FcBo64K3FcJXl8N3nCk8fcG/eDhhuGNwdcWMkdj3JnDC+bOAvO0BPO0hJSWAymjHaSsjmBZHSFldaJBOWprleG+9U1w/2Ee2vh50r/QS+qntVJWJ5728DKwtBxKjGaK1x5AuGQ59H1roJetg7F/PfSKbfE/pZVJkLK7cLlNb8i5PSG36wu544V0fkAkzy7gg+/5odD3rmS2hJ65Mrp4H1qyQ87tQdnQhIyD2xHavBD6zsUI71oKo2qXpb7lljLacrnTRVC6DIbSfTjkvJ700Jp6nofL4Jt6EYyavcxe0MsavPfN58o5wygLTnWDUAPCW75EeMOnCG1eAKNyp1AbNkgt2nCl+xVQe1wJpecvaHHV6bqxsnXwPTeYHW+5Uh56xuC+5XWuXXg7Pf0TQd8wD6HV/0Jow6dJS4aYP2rVBaVgBFf7Xge1z2haTn2CwpsXwPfS1UnZZjvh0DuHP86do56mpw5A3/0DgsvfQHDFrK7cf2hnKt8r0zxQz7ueaxf9Ekq3S2k/QwCBRS/AP/s+ltLQK/lF3HvvfFsvvuHBOoR+/CcC3/3DtkcmS9lduGPwPdAuvhPMnWlr8Ovfvh3BH95iKQm9lNWRpz2yAsybbcuHa9TsQeC7vyO49NXhvL7mS6pzGt1fu+BWrl36AOSc7jZt7fzwPTsIeukqllrQq06k/WYRlzv0tx/s1SUIfDMNgSXTGUINRPpps1CC2vMq7vzFH225UYpRvRu1f+k/h/sqx6UM9O5bXuXaRXfY7kE2fPYHBH98J/7v0FMGfga1zxjuvPpPsNur3NDG+ah76SoGbogPvTZgAnff9rZ9yrX6GjR8OQWBb58nZzfh/NqACdw5+hlI6Xm2uW3/x48jsHAKExp6KasTT3t8NZirhQ2sXUdg0Qto+OyPk3h99QwiNzY9v2P4Y9xZ9CigOFL/hvUgaqcOhL63mIkJPZPgvf9rrnQbmvrPau9K1L93T8qfa54sSa26cdcNf4faY2Tqe8fB7aid0o/xgC9+8YzXX+wc8UTKA88DPvjnTEbtXwYwAj6uILC6F69k9W/cDO6rTPUBDq4xU+P6RV5cnF7udCFPe3AxICkp+3DC279D/Tt3CLdMVviSPy2Hu8dPh9pndErfZ93LYxBa+2Fcciv2Tq844L7l9dQFPhyA/18Pwve3yxgBn4TqqvYAq3v5Wlb/9m1IleXKp5N7/Etg7qy7hYDeOeIJLucWpGaZWb0btc8PReCbaQl5tUI6s4I/vM1qn+4DvWR5qlY0cI35y3TLQy/n9eLO4Y+l5EMIrXwPtU/3YXrJcnJ36wzCrPb5oSzw7/9LyfvTLvwVlPzLuXWhZxJcN6XgSbKGDv/Hj6Pu9fEslctJodutOZMbJ/lC/hSzewb3za/EfFepmEHvuPR+rnQemFr9Y6AWda9cl5AFEyST5X7xLOZ7dhCMmj0pdV9SVic4r3ySWw56KT2XO6/679Qy+MqdqP3fAQit+5iAF0R66Srmm3ox9NJVKXVfjssegpzbg1sKeuc1fwZzpKVO8uxfD9/zQ2BUbCHgRRusD5cx37QhLLzpixSyewWuG/5mHaeX2/VLqV1wwtu+he+5wcw4tI+AF7Yt88E3fRQLFs9KmXtS8i+H2utqbgnoXddPA5iUEoENbfwcvhevZNx/mMgRvlwLov7NW1hg0Qspc0uu66fF5BsEU7Sq59/IlW5DUgP4DZ+i7pXr6Mu4lLJ8Dv+cySnzSk/K7grHkMk8edDLGlwpstddaM1c1L08hoBPVfDf/zULLHoxJW7HOfL3YO7MoqRA77j4Di617Cx+D7/1a9S9cVNSdiUlJdLx72PBZa8LfyvMlQHHZf+5MPHQKw44rvid+G3f7h9QN2M0QzhAYNgA/PpZd7HQmn8JfyuOSx8AS2tdnVDoHYMmcdGPM9LLN8H34i+mxPO7ZZLFZOiof3MCC+9YLLbbO7xwXv5IZuKgV51wFD0q9qBfV4W6GaPA66oeJxJsZvghP+pevnaKcXC70PehDbkPUos2PCHQOy65j0sZbQVu4gOoe/laGAe303t4u4JfV/V43YxREPnVLFNdUZtvZNDLGhzDHhT6gdfPuhvhHYsJeJtLL9/E6l4bBxi6uG4/cGJU39xHBL1WOF5olw8seiHhp4mQLFz0bV7AGj77o7hur3nguOSe6XGFXmSX10tXo2HuwwQ86SQ1LPgfFlr7kbDX7xh6P6A64wO9kl/E5XbnidnD+Q+h7pXrUu97a1IMkoOjfuadU0T9JJeltYZWeDOPC/TOyx8W9rn637sXRtUucnnS6bmvq3q8/s0Jwvb3zuGPRvT9S7N+p5zTnSvdrxAyIMHiWQgWzyLgSU339zsWscC304S8dql1PpT8Ih5T6LWBdwl5nrhxqBT+2fcNp5QmNasi/OQJppetE7O3H3RXDJ1e1qBdcKuYD3H2faBjoUnNt/sA6mfeKWSZr/YeDSk9l8cEerXvGM68rYQLQmj1+7TVFSli6bt/FPMbfFmFOqB55nxW6B0D7xLu/nnDEfg/+A1lMCkqNXzyBDMOlYpX4g+c2Kw2vEnopeyuXDn3MvEe2qdPgra7IkVtGoFa+P/1kHDXLbU+F0rXIdwU9NoFtwo3gWdUbEFg0QsEPMlce7hqDgvvWCTcdWsX3mbO6dV+Y4W7af/ch0EbYpBikkvvPwDRji9T+1531gNnzgi9nNeLy7k9hLrh8NavEVo/j1yeFBPppatYcMVMoa6ZuTKgdm/6nf0ZoVcLbxSvlxf44wmShXPKCIvl9v3GRef06nk3iOXym75AeMcicnlSTGVU7mDBH94SrMQf0+RHOKeFXm53HpdzupPLk0gAGuY/BehBcUp8ZzrU/OE8IujVXteI5fJbvkK4ZBm5PCk+bl+1S7jeXu09KjKnV3pcKdQNBr7+K2UmKb459tVUgHNhrlfpMfKMr9t/Bj1zZxYpHS8Q5ub0/esR2vQFuTwp3nnGwlsWCnO9UkY7yLk9ebOgVwtGLIQkizMCfzNNqBGYJLDbf/OcUNd7por9Z9ArBSOFuSnuP4wQfStPSpBCm75gRuUOcfr6HiObAT1jUApGCHNTwRUzwYP1lI2kBLkMh0hHYyldB4M5vE1DL+d051J6rjjQL32FEpGU4Jx7VZxl3rIGufNA3jT0nQcKE3x93xroe1dSaU9KqIwj5Sy0eYE4bt9lUNNOr3QdLM6IWzyLMpCUnN6++N0Ugv40v8GygV/1PmUfKTm5t/YjJsp26nLniwBJOT30zJs9W8ruJkZpX7IcRuUOKu1JSREP1CK8cb4Q18o0D+S2ffhpoVe6DBoryoYZobUfUuaRkpyDc4Ut8Y9DL3cYIE7AN35GWUdKcg7OLxZlgw25feEZoG/TW4gbMI7sh162jkp7UnJLfN/B/vqeFWJA37aP2NCHN3xGy25JFnH7z4W4Timn4KTJPAlo/P5WyuokBvRbv6ZsI1EuRiCmOiG3PpefBL3ctg8XZRIvvGMxZRvJGrlYspwhHBDD7U+o5Buhb9NHjH6+ejeMmj3Uz5MsQn0A4b3FYvT1p0IvCbI1VngnuTzJWtIFqTxP3Nm6EfqWYvTzosyWkmxk9oLk5ImMH4W+sxjQl66hLCNZLCdXiwF91qnQZ3UUI8Bla6dQmpGsJKNyB+MBn+Wvk7kzwVwZXQBAYp6WzzBHmvWDe6gUvK7qcUozkqXEDehl6wQp8TvvAABJatn5MSFG1ANbKMFI1szNiq1C9fWSlNlBjMBW7aTsIlm1xBekr+94FPq01mL08wJtSEiyG/RiGBLzZDdCz9xZFFgSyQ5O7z0G/dEfrC5+aB9lF8ma0B8WIzeZp+VR6I/+YPnA+ioou0jWzM3aCibCl58nQC+I09dW0Jp7kjUVDoA3HBGop/dkiRHUQC0lF8nCpnRAIKc/zQkYliufavbQxhkki+foXutDr3mOQi+rlr9Y/cBmyioS5ahZKY5G6I/9YOnqXpBtiUg2bus3fWF9p1e0o9DLmrV7pfpqBIvfm0RpRbKyhDjRlkmArEJiVoaeG6h/7x7w+uoZlFYka9f3QdTPnAgearC42zsgQbVmea+XrYPvhSsRWjmbXtWRxCjxt33LfM8PRXjX99a9SFm7mxmBOs40d9R9TGDpqzGOXAD6/g10bBVJaEmZ7bncpg8QJVtnktp7FLQBE6L+84d/l1OjmDlr26guQWjVHIKTRDqVjZq9LB6v8U7cyjpKU82SoAfNlAr0dEmkxJbnJivpICQeNgG9QtCTSAmVSea4HoRkZrN+Rk5PIiVUppgzwoChQ+JmTugQYGEPiZRaTh89c8dYlxCqj37UcbWgh0AiJdLpzTAXbGRd4nVVJi4gk54CiZRI6N3RM2f4KhuhP/ZDoi+ARCIllrljBi/xOjPQZ9BTIJESWt6bgb4yBuW95qV39SRSQp0+eqPl9dXmoQdjkNJzaHcLEikRkmRI3ui3rOe1B4/29If3m7uOFm3pYZBIiWA+PZdDkqP+88bRLb0ko2aPuXKjRRt6GiRSIkp7kwZrVO8+Cn11yRxTo08GOT2JlBCnN2mwRnXJ0Z7eVznOzFG7UnZXMUdN1QXmziwCo48EbeWWrowuLMafuyYM+uwu5qCvKpkEAMox25fzekZ3Ia3PtXikFMjtzuNKl0FQugyClFsAKT0PJx3yoQehl2+GXr4B4a3fILT2w2LuO9ifEBEbbrX3NTuU/CLIeb0g5RaAqa7j/5/7D8M4vA9GxTaEdy6Bvut7hPesYGa+RYm3ZBOs8UDt8R2olGO2Hy30shWhZxKUroO51v8WqP1uwFnP65M1yG37QG7bB1rhTcCNLxaG1s/jDQv+DH33D1QKCCQ5twd3XPFbaOePa/J1MnO1gOxqATm3B9Q+o4+C4eOhtR8itGImQpsXMhhha/lXq3PMuPzxnxuhr9gG9IzyQlp2BnOkWeIwCimzPdcungjtol9Bymxv4i+SofYZDbXPaARXzOT+Dx6Yw32V4wgpCzu7wwvnqKe545J7GzeAjPLv0AZMgDZgArjvIA/+8DYCS2bAqNhiiYFfzusVPfQHt50Mvb5/vSlXldv34+Ht/05OYJgEtcdIrg2aBLXnVTDzSuN00vrfDDX/8rF1L1/Hw7u+J9e3qLt77v4IUqtusUsrbys4LnsIjmEPIrz9Wx5YPB2hNXOZqU1nTBlaB85MHCuvl60/xen3bzAX9PaFCG//d2KDkJ7HtYvvgDbwLkhZHeM7rqTlwHv/16h74yYeWjOXwLeQlK6XcM+kT+L3xSdjUM4ZBuWcYeC1FTyw7DUEv38ZRuXOhOaB3MHcFJNevuFUp9/AwDmPdibb7AVF9ADOvZw7Bk+C2ns0kMjTeRQHPL96F77po3h40xcEvhUcvkN/7vmPeWDO9MSkX1prOIc/DmfRowhvXsgDS6YjtO6ThPT+codCU3/+RGNXGicwamEc2gsps0N0PMQZeubK6KKeP26HY+j9UU84xibyGjx3zoHvrxdyvXwTgZ/MHj4th3vumpsw4E9tKZWCEVAKRsA4Us5Dy99EYPFLMKpL4pYTSocBJmw+BL1i2/Frk05X80dcarfqFpfySuk2hLtvf4e3+HP5Dvf46ckF/vhkTxrct74FSAqRl0S5b34FUka7pF+HlJ4Lx/DHkP6H7fBM+pirPa/i0U4kNt1Cnx898xVbceJcxE/Ql64yNfLJ7c6PyYc3zJ1Z5Lj0AZ72xEbufeA7aP1vtty2XHKH/nAMuY8+NEqS1POu52qvq611UZIMtdc18PzHPKT/cSd3jniCS+l5MckRqWVnftK6kkihP4Xtn6DfuzKpEw1y+0LuHj+dp/9p70LX9dMg5xZYOvGcV/wWoq7sEruul+Ac+aSlL1HK6gjn1U8h/U974Z28kKv9xpr6UEbuOMDU9eh7i0+uoGMFvdKhEJGuZWLOdGgDbuHaoEmQ2/YVraeENuhuHvhmGvX2iXT5vtdxuW0fMS5WkqHkF0HJL4JxcDsPLJmB4PI3Il7tqbQ73yT0K0/v9EZ1CeMmts6KxOnl3B7cdcPzPP2pfdw17gXhgD8mbcCtRGHCYz5ByOuWWnWD69r/RYunSgs9d8zmSn5Rs9+WmXJ6bkDfu4qd1umP1f5K9+FR9h1dwNyZRby+5svTOqPmgVo4njsGTTJdrlimt2/XDywth/PaA+T2iXLO7kWCJ40Gtd9YqP3GQi/fxINLpiP4w1vDz8QNGIPcrl/U/5xxcNvPVsueNM0YPqX2j6zeZZDbFy48HeyuUc/w9Kf2cffNr6QM8MfvWdAqRUjms7txpnlS5n7k3AK4rp+G9Kf2LXSPf4kzb/bsn99zV25mM8zwadp2qanaP/IS/+QFBFLrfJ72xHruGP5Yyu6RL7fpTTRSrM15h+qCNmgS0p/YNFbpdNFJM/5m18DoZ4e+2NQ/cOIFyrkFPO0330HK6pTaiSjKpBLF2vrwe7PhmbwQStfBx8GX25tbiafvKW4aeqNqFzu2Y2Z0Tt8IPXOkwX3nB2BpOTZwH4I+cdCnfivFHF547vwAUkY7DpidxOPQS1d1bRJ6cA59b/SLdKSsTmDe7Nmucf/Hrf6ePZZ9WUK/AaDyPvXBT2sN9+3/PLrozcQkXuUOcP+hnU1DD0AvNdfXO4ZMHivqa5XoehoH5Nb5tDov3iA401O+VTwprboNhfPKP3Az3xacqV3/GfThPeb6eufI/4Ld9p2jybwExDivF7dbXjlH/t7Unw+fYWL+505vcgY/Hh8bWF0STebFH/p259mwvDHHUrOd3qjczrj/EGVZRE5P0Md9YKVqKjI1zs9Nahb0jTN+qylokUBPTk8xtpiMql3Hd789O/Qw/77edi6U0Q7M0/IZikS8ylxmalNIO6ophs8A/UqKWsQlfu/HKApxGlRbduZJ2SFHaOhXEvTU11Ns7aRwxNBXbGVW2MdeMKenIFA/bx2nL11VHBH04AZN5lFi0oAqqIzq3Whqo44zvgjU99BkXkR9Z14vW65RoPLeiv180+yeGfpS6usjEdPckFp1o+W4sY6r6hL2ZOTkQb8ySujJ6akMtUIF1aYXj/VRZeT0Z/qDBzYzM+fWE/QkKu2To/BZvpQ9cxPKDehlaymClKA0kAok41ApzrZnY5MzT1TiR5igNINPMU12ad8MZiUzEwKkU4LZsgto5ViMoc8jp48I+mZMwEtmJgRIp4gxyHk9aQY/VoNoRlvOvNkUiIQ6fflGxoP1FMlIEpX6+hj28xTLiKHfa9LpYeg0mRdxolI5GrMBlPr5iGQcLoNxZD8zBz319ZFDT4lKA6iFXb550NMMfuQlKaNTrqi8Twb0xTGCnpbjRiTmagEpswNN5pkmXoOck09xSIrT79/AeKiBIkoOldgY5hZwyBoFIhlODz0Eo2wdRZT6eoqhhcVrD8A4tI/FBnqYPM3Wlk5PE1AUw8QqkvMqmgU9zeBHJnpXTy1Swkv7CObemgk9OX1ECdv6XDDVRYEwM3BSeR8Z9DF3+rL1DOEARbbZUZUh5fagGfwoxbzZs6X0PApEJNDvjbHTQw9C37+BIhuJ25NTmYhd37EUheaL+yph1OxhsYWeSvwoelKaiKJ+PlEuHxmbEUBPk3mUuDRgWlHheEFPr+0iLlEpCNQaWa6fj8zp961l0EMU4WaKebMhpefRZF6kapwEpThEAv2eODk9wgGazIs0f8mxInf51udyet3ZfPH6Ghg1u1l8oAd9fEN9fQIGSopZhKV9McAjKygjg54+s40QepqQophZq7SPHHqawY8sgam8p5jFWeEoqu+IoA/vW02TeZEkcG4B6PNQaomEdnqEGqAf2EyRbnYGa5Bz8mkGv5k6ugEJBaKZ4v7DMKp2svhCTyU+OVd8Y8Vpq7EIWCxdGfEkXpTQ02ReZIlME1PUz1untCenT4DoXT0NkHGDPkoWI4e+dBWDoVPEqbyP/QBJsYpI0S6Njxh6HqyHXrGFIt7cAGe0BfNmz6ZInEWNR4JRHJrLYcMRGAe3s4RAb6aXsK3b5/Wm78PPlogtu3A6/DOiihvgBhIHPS3HjQx66uspRhbp58npE9bX0wTV2WNE0CeKwSidfhWLtrSghCbRwBiL8j7BTs8DPhgHt1HkmxvkNr0ASaZAUHkfE/GAD3rFVpZQ6IHINte3u5jqgpTdjZbjnik+mgdSdlcKRLNdfjXMvDaPGnpapENOFsNKiINJFIhms2fOcKVk/cPUs5J+ig0NiIk0XDNOT5N5lNg0INrJ6XnDERiVO+gJUHlPsUmgeLAe+oEtLCnQU18fYaCzOoFWnJ0B+rxeFITmMrdvDWCEkTToaQY/AjEGuU1vmsE/NQEz23PmaUmBSFBpb97paTkulbGm+3mKSaKra7Pl/fBodu6wravl0YQVDYSCOz2vr/nSqNpFT4ISPPoEpJn75vMWaoBevsn0fmKK2b/A//6vwTLaRf4PdxgAbeBEm5WyvQHGQNXRKTGxmUJr5iK0aX7k0PsPIxa7UZuGPrThs6hGHr1kObcb9MyZDimrEzeqdtHujwCgOCC3zrfdbQeXv4HQuo+TlgNJW/uo79/AeKiBSnw7u3xuDw5ZtWFfntwJ8OQteDbCMMrW2bCcJejtPADy2goYh0qZPaGHPc+8pyWn9o6FFXI+qdDbcUUflff2rnqskPMEfaIDnt0NTHMT8TYdAAn6snUM4YDNqJch5fW0/Ts75m21gqXl2BB6m5f30IPQ92+gstaOLt/uvEK73TOvq4JRvZvZG3q79vU0mUf9vL2ht+EMPk3m0cy9naEP23IGvy9BT5N4Nnb6srUsFuuJRRJzZ0Fq0ca+k3mSAimnwIbQk9M3KtQAvXwjOZ2d7r31uZypTlvdM/cfglW+ubDEvsO2fF9v4xl825b2Fvm6kqBPVuLbeAbfjt/QW2nCWqKAJAt6Gzs9va4j6PV9a5iZY3qETPzc7oCs2RRCokPnAAACMElEQVR6O76uW0XQn6jGvbw32yzzNUjpufabwZdkSJntbXXLPFAL4+A2RtBTiQ/oQfvdM+ewW1XXOIlnndOgJEsFxkYyjpTDqK2w37ZZ3IBettZm0K+y1PUQ9Mnq8dZ9DLueBRha97HNoC8m6E8bmNJVtjoQM7hqDuyq0Ko5thrwrGZoloGeB3zQK7baw+W3/xvhLV/adkdcvXwTC66YaY9uJuCDXrGFEfSClEHxyQKOho8eg93V8OmTsMMGKo0HTlpr4tJa0O9amvJJEPh6KsIly2y/771RtYv5bTD46TsWW+6aLAV9aP28lO719JLl8H/yOzro4tgA+N3fWGjthyl9j1actLQU9Eb1bhZaPy81na1yJ+pevQF2+4z4bK1O/T9/yVK1rdNLVyNcspQR9Gfr9T56DDDCqQV8zR74/lGU9EMOLMm9/zB8fy/qqu/+MeXuzf/Ro5Y8t9By0OsHNrPg0tdS5sGHS5bB99xg0Pl1TYF/aKfvhZGTQhs/T52yfuN8hDcvtOQzl6x4Uf65DzOjYovgmWwg8NVf4Zs2hBk1ewn4s4WrvnpG3UtXMf+HjwrfAvHaA/DPsu7hrKxmsjUvTMrswL2TF0AS7VRTI4xg8bsILHgaevlGgj2aZ5/VkTsufwTaxXdCtB12jMNlqHvxF41fjhL0UVyc6oLS+xrOXBlijPBHyhHe9f0c7qscR+jG4Pm7WkDpPJCzjHYAE2D8DNYjtH5eV+4/tNPKl/n/2SmrgTmMd4MAAAAASUVORK5CYII=);
	}
`;

googlepm.fetchData = function() {

	return new Promise(function(resolve, reject) {

		if (!settings.googlepm.active) return resolve();
		pm.init({masterToken: settings.googlepm.masterToken}, function(err, res) {
			if (err) {
				settings.googlepm.error = true;
				return reject([err, true]);
			}

			data.googlepm = {};
			data.googlepm.mymusic = [];
			data.googlepm.playlists = [];

			pm.getAllTracks(function(err, library) {
				if (err) return reject([err]);

				data.googlepm.mymusic.push({title: 'Google Play Music', artwork: '', icon: 'note-beamed', id: 'library', tracks: []});
				data.googlepm.playlists.push({title: 'Thumbs up', artwork: '', id: 'favs', icon: 'thumbs-up', tracks: []});

				for (i of library.data.items) {

					if (i.albumArtRef === undefined) { i.albumArtRef = [{'url': ""}] };

					data.googlepm.mymusic[0].tracks.push({'service': 'googlepm', 'source': 'googlepm,mymusic,library', 'title': i.title, 'share_url': 'https://www.youtube.com/results?search_query='+encodeURIComponent(i.artist+" "+i.title), 'artist': {'name': i.artist, 'id': (i.artistId ? i.artistId[0] : '')}, 'album':{'name': i.album, 'id': i.albumId}, 'trackNumber': i.trackNumber, 'id': i.id, 'duration': i.durationMillis, 'artwork': i.albumArtRef[0].url});

					if (i.rating == 5)
					  data.googlepm.playlists[0].tracks.push({'service': 'googlepm', 'source': 'googlepm,playlists,thumbsup', 'title': i.title, 'share_url': 'https://www.youtube.com/results?search_query='+encodeURIComponent(i.artist+" "+i.title), 'artist': {'name': i.artist, 'id': (i.artistId ? i.artistId[0] : '')}, 'album':{'name': i.album, 'id': i.albumId}, 'id': i.id, 'storeId': (i.storeId ? i.storeId : undefined), 'duration': i.durationMillis, 'artwork': i.albumArtRef[0].url, 'RatingTimestamp': i.lastRatingChangeTimestamp});
				}

			  pm.getFavorites(function(err, favorites_data) { // Works only when all-access
			  	var added;
		        var favorites_data = favorites_data.track;

		        for (f of favorites_data) {
		        	for (var z = 0; z < data.googlepm.playlists[0].tracks.length; z++) {
		        		if (data.googlepm.playlists[0].tracks[z].storeId == f.id ||
		        			(data.googlepm.playlists[0].tracks[z].title == f.title && data.googlepm.playlists[0].tracks[z].artist == f.artist)) { // Already in favs, but this one probably has better metadatas

		        			data.googlepm.playlists[0].tracks[z] = {'service': 'googlepm', 'source': 'googlepm,playlists,thumbsup', 'title': f.title, 'share_url': 'https://www.youtube.com/results?search_query='+encodeURIComponent(f.artist+" "+f.title), 'artist': {'name': f.artist, 'id': f.artist}, 'album':{'name': f.album, 'id': f.albumId}, 'id': f.storeId, 'duration': f.durationMillis, 'artwork': f.imageBaseUrl, 'RatingTimestamp': f.lastRatingChangeTimestamp};
		        			added = true;
		        			break;
		        		}
		        		added = false;
		        	}

		        	if (!added)
		        		data.googlepm.playlists[0].tracks.push({'service': 'googlepm', 'source': 'googlepm,playlists,thumbsup', 'title': f.title, 'share_url': 'https://www.youtube.com/results?search_query='+encodeURIComponent(f.artist+" "+f.title), 'artist': {'name': f.artist, 'id': f.artist}, 'album':{'name': f.album, 'id': f.albumId}, 'id': f.storeId, 'duration': f.durationMillis, 'artwork': f.imageBaseUrl, 'RatingTimestamp': f.lastRatingChangeTimestamp});

		    	}

		    	if (data.googlepm.playlists[0].tracks > 0)
			    	data.googlepm.playlists[0].tracks.sort( // Sort by rating date
					    function(a, b) {
					    	if (typeof b.RatingTimestamp == 'undefined')
						  return -1;
						else if (typeof a.RatingTimestamp == 'undefined')
						  return 1;
						return b.RatingTimestamp - a.RatingTimestamp;
					    }
					)

		    	updateLayout();


				  pm.getPlayLists(function(err, playlists_data) {

				    pm.getPlayListEntries(function(err, playlists_entries_data) {

				      if (playlists_data.data)
					      for (i of playlists_data.data.items)
					      	data.googlepm.playlists.push({title: i.name, id: i.id , tracks: []});


				      if (playlists_entries_data.data)

					      for (t of playlists_entries_data.data.items) {

					        if (t.track) { // If there is already track metadatas then it's an all access song
					        	if (t.track.albumArtRef === undefined) { i.track.albumArtRef = [{'url': ""}] };

					        	for (pl of data.googlepm.playlists)
					        		if (pl.id == t.playlistId)
					        			pl.tracks.push({'service': 'googlepm', 'source': 'googlepm.playlists,'+t.playlistId, 'title': t.track.title, 'share_url': 'https://www.youtube.com/results?search_query='+encodeURIComponent(t.track.artist+" "+t.track.title), 'artist': {'name': t.track.artist, 'id': (t.track.artistId ? t.track.artistId[0] : '')}, 'album':{'name': t.track.album, 'id': t.track.albumId}, 'trackNumber': t.track.trackNumber, 'id': t.track.storeId, 'duration': t.track.durationMillis, 'artwork': t.track.albumArtRef[0].url});
					        } else {
					        	var track_object = getTrackObject(data.googlepm.mymusic[0].tracks, t.trackId);
					        	if (track_object) {
						        	track_object.source = 'googlepm,playlists,'+t.playlistId;
						        	for (pl of data.googlepm.playlists)
					        			if (pl.id == t.playlistId)
						          			pl.tracks.push(track_object);
						        }
					        }
					      }

				      for (p of data.googlepm.playlists)
				      	if (typeof p.tracks[0] != "undefined")
				      		p.artwork = p.tracks[0].artwork; // Set the first track's artwork as playlist's artwork
				      	else p.artwork = '';

				      renderPlaylists();
				      updateLayout();

				      resolve();

				    });
				  });


		      });


			});
		});
	});

}

googlepm.login = function (callback) {
  settings.googlepm.user = getById("googlepmUser").value;
  var pm_passwd = getById("googlepmPasswd").value;

  if (!settings.googlepm.user || !pm_passwd ) return;

  pm.login({email: settings.googlepm.user, password: pm_passwd}, function(err, pm_login_data) {  // fetch auth token
    if (err) return callback(err);

    settings.googlepm.masterToken = pm_login_data.masterToken;
    getById("btn_googlepm2").innerHTML = settings.googlepm.user;
    callback();

  });

}

googlepm.like = function (trackId) {
    pm.getAllTracks(function(err, library) {

      for (i of library.data.items)
        if (i.id == g.playing.id) {
          var song = i;
          break;
        }

      if (typeof song == "undefined") {
        pm.getAllAccessTrack(g.playing.id, function(err, track) {
          track['rating'] = "5";
          pm.changeTrackMetadata(track, function(err, result) {
            if (err) new Notification('Error liking track', {'body': err, 'tag': 'Harmony-Error', 'origin': 'Harmony' });
          });
        });
      } else {
        song['rating'] = "5";
        pm.changeTrackMetadata(song, function(err, result) {
          if (err) new Notification('Error liking track', {'body': err, 'tag': 'Harmony-Error', 'origin': 'Harmony' });
        });
      }

    });
}

googlepm.unlike = function (trackId) {
	pm.getAllTracks(function(err, library) {
      for (i of library.data.items)
        if (i.id == trackId) {
          var song = i;
          break;
        }

      if (typeof song == "undefined") {
        pm.getAllAccessTrack(trackId, function(err, track) {
          track['rating'] = "1";
          pm.changeTrackMetadata(track, function(err, result) {
            if (err) new Notification('Error liking track', {'body': err, 'tag': 'Harmony-Error', 'origin': 'Harmony' });
          });
        });
      } else {
        song['rating'] = "1";
        pm.changeTrackMetadata(song, function(err, result) {
          if (err) new Notification('Error liking track', {'body': err, 'tag': 'Harmony-Error', 'origin': 'Harmony' });
        });
      }

    });
}

googlepm.getStreamUrl = function (track, callback) {
	pm.getStreamUrl(track.id, function(err, streamUrl) {
		if (streamUrl == undefined)

			api.getStreamUrlFromName(track.duration, track.artist.name+" "+track.title, function(err, streamUrl) {
				if (err) nextTrack();
				else callback(streamUrl, track.id);
			});

		else callback(streamUrl, track.id);
	});
}

googlepm.contextmenuItems = [

  { title: 'View artist', fn: function(){

    googlepm.viewArtist(trackList[index]);

  } },

  { title: 'View album', fn: function(){

    googlepm.viewAlbum(trackList[index]);

  } }

];

googlepm.viewArtist = function (track) {
	listView();

    getById("search").value = track.artist.name;
    changeActiveTab("googlepmAll", true);
}


googlepm.viewAlbum = function (track) {
	listView();

    getById("search").value = track.album.name;
    changeActiveTab("googlepmAll", true);
}
