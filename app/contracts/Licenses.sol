// https://gist.github.com/whitj00/5e70327b656732e3355c

contract Licenses
{
    struct License
    {
        bytes32 name;
    }
    License[] public licenses;

    function Licenses()
    {
    }
    
    function addkey(string key)
    {
        bytes32 hash = sha3(key);
        licenses.push(License({
            name: hash
        }));
    }
    function checkkey(string key) returns (bool diditgetfound)
    {
        bytes32 hash = sha3(key);
        bool found = false;
        for (uint p = 0; p < licenses.length; p++)
        {
            if (licenses[p].name == hash)
            {
                 found = true;
            }
        }
        return found;
    }
}

